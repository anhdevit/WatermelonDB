"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDispatcherType = getDispatcherType;
Object.defineProperty(exports, "DatabaseBridge", {
  enumerable: true,
  get: function get() {
    return _DatabaseBridge.default;
  }
});
exports.makeDispatcher = void 0;

var _rambdax = require("rambdax");

var _DatabaseBridge = _interopRequireDefault(require("./node/DatabaseBridge"));

var _common = require("../../../utils/common");

var _Result = require("../../../utils/fp/Result");

var _common2 = require("../common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || "[object Arguments]" === Object.prototype.toString.call(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var dispatcherMethods = ['initialize', 'setUpWithSchema', 'setUpWithMigrations', 'find', 'query', 'count', 'batch', 'batchJSON', 'getDeletedRecords', 'destroyDeletedRecords', 'unsafeResetDatabase', 'getLocal', 'setLocal', 'removeLocal'];

var makeDispatcher = function (type, tag) {
  var methods = dispatcherMethods.map(function (methodName) {
    var name = 'synchronous' === type ? "".concat(methodName, "Synchronous") : methodName;
    return [methodName, function (...args) {
      // $FlowFixMe
      var callback = args[args.length - 1];
      var otherArgs = args.slice(0, -1);

      if ('synchronous' === type) {
        // $FlowFixMe
        callback((0, _common2.syncReturnToResult)(_DatabaseBridge.default[name].apply(_DatabaseBridge.default, [tag].concat(_toConsumableArray(otherArgs)))));
      } else {
        var promise = new Promise(function (resolve, reject) {
          // $FlowFixMe
          _DatabaseBridge.default[name].apply(_DatabaseBridge.default, [tag].concat(_toConsumableArray(otherArgs), [resolve, function (code, message, error) {
            reject(error);
          }]));
        });
        (0, _Result.fromPromise)(promise, callback);
      }
    }];
  });
  var dispatcher = (0, _rambdax.fromPairs)(methods); // $FlowFixMe

  return dispatcher;
};

exports.makeDispatcher = makeDispatcher;

function getDispatcherType(options) {
  if (options.synchronous) {
    if (_DatabaseBridge.default.initializeSynchronous) {
      return 'synchronous';
    }

    _common.logger.warn("Synchronous SQLiteAdapter not available\u2026 falling back to asynchronous operation. This will happen if you're using remote debugger, and may happen if you forgot to recompile native app after WatermelonDB update");
  }

  return 'asynchronous';
}