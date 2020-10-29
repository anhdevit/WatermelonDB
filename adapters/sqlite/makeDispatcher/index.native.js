"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDispatcherType = getDispatcherType;
exports.makeDispatcher = exports.DatabaseBridge = void 0;

var _reactNative = require("react-native");

var _rambdax = require("rambdax");

var _common = require("../../../utils/common");

var _Result = require("../../../utils/fp/Result");

var _common2 = require("../common");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || "[object Arguments]" === Object.prototype.toString.call(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var {
  DatabaseBridge: DatabaseBridge
} = _reactNative.NativeModules;
exports.DatabaseBridge = DatabaseBridge;
var dispatcherMethods = ['initialize', 'setUpWithSchema', 'setUpWithMigrations', 'find', 'query', 'count', 'batch', 'batchJSON', 'getDeletedRecords', 'destroyDeletedRecords', 'unsafeResetDatabase', 'getLocal', 'setLocal', 'removeLocal'];

var makeDispatcher = function (type, tag, dbName) {
  var jsiDb = 'jsi' === type && global.nativeWatermelonCreateAdapter(dbName);
  var methods = dispatcherMethods.map(function (methodName) {
    // batchJSON is missing on Android
    if (!DatabaseBridge[methodName] || 'batchJSON' === methodName && jsiDb) {
      return [methodName, undefined];
    }

    var name = 'synchronous' === type ? "".concat(methodName, "Synchronous") : methodName;
    return [methodName, function (...args) {
      var callback = args[args.length - 1];
      var otherArgs = args.slice(0, -1);

      if (jsiDb) {
        try {
          var value = 'query' === methodName || 'count' === methodName ? jsiDb[methodName].apply(jsiDb, _toConsumableArray(otherArgs).concat([[]])) // FIXME: temp workaround
          : jsiDb[methodName].apply(jsiDb, _toConsumableArray(otherArgs));
          callback({
            value: value
          });
        } catch (error) {
          callback({
            error: error
          });
        }

        return;
      } // $FlowFixMe


      var returnValue = DatabaseBridge[name].apply(DatabaseBridge, [tag].concat(_toConsumableArray(otherArgs)));

      if ('synchronous' === type) {
        callback((0, _common2.syncReturnToResult)(returnValue));
      } else {
        (0, _Result.fromPromise)(returnValue, callback);
      }
    }];
  });
  var dispatcher = (0, _rambdax.fromPairs)(methods);
  return dispatcher;
};

exports.makeDispatcher = makeDispatcher;

var initializeJSI = function () {
  if (global.nativeWatermelonCreateAdapter) {
    return true;
  }

  if (DatabaseBridge.initializeJSI) {
    try {
      DatabaseBridge.initializeJSI();
      return !!global.nativeWatermelonCreateAdapter;
    } catch (e) {
      _common.logger.error('[WatermelonDB][SQLite] Failed to initialize JSI');

      _common.logger.error(e);
    }
  }

  return false;
};

function getDispatcherType(options) {
  (0, _common.invariant)(!(options.synchronous && options.experimentalUseJSI), '`synchronous` and `experimentalUseJSI` SQLiteAdapter options are mutually exclusive');

  if (options.synchronous) {
    if (DatabaseBridge.initializeSynchronous) {
      return 'synchronous';
    }

    _common.logger.warn("Synchronous SQLiteAdapter not available\u2026 falling back to asynchronous operation. This will happen if you're using remote debugger, and may happen if you forgot to recompile native app after WatermelonDB update");
  } else if (options.experimentalUseJSI) {
    if (initializeJSI()) {
      return 'jsi';
    }

    _common.logger.warn("JSI SQLiteAdapter not available\u2026 falling back to asynchronous operation. This will happen if you're using remote debugger, and may happen if you forgot to recompile native app after WatermelonDB update");
  }

  return 'asynchronous';
}