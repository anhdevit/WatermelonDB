"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shallowCloneDeepObjects = shallowCloneDeepObjects;
exports.default = void 0;

var _lokiWorker = _interopRequireDefault(require("./lokiWorker"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// shallow-clones objects (without checking their contents), but copies arrays
function shallowCloneDeepObjects(value) {
  if (Array.isArray(value)) {
    var returned = new Array(value.length);

    for (var i = 0, len = value.length; i < len; i += 1) {
      returned[i] = shallowCloneDeepObjects(value[i]);
    }

    return returned;
  } else if (value && 'object' === typeof value) {
    return Object.assign({}, value);
  }

  return value;
}

function clone(data) {
  // TODO: Even better, it would be great if we had zero-copy architecture (COW RawRecords?) and we didn't have to clone
  var method = data.cloneMethod;

  if ('shallowCloneDeepObjects' === method) {
    var clonedData = data;
    clonedData.payload = shallowCloneDeepObjects(clonedData.payload);
    return clonedData;
  } else if ('immutable' === method) {
    // we get a pinky promise that the payload is immutable so we don't need to copy
    return data;
  }

  throw new Error('Unknown data.clone method for workerMock');
} // Simulates the web worker API


var LokiWorkerMock =
/*#__PURE__*/
function () {
  function LokiWorkerMock() {
    var _this = this;

    this.onmessage = function () {};

    // $FlowFixMe
    this._workerContext = {
      postMessage: function postMessage(data) {
        var message = {
          data: clone(data)
        };

        _this.onmessage(message);
      },
      onmessage: function onmessage() {}
    }; // $FlowFixMe

    this._worker = new _lokiWorker.default(this._workerContext);
  }

  var _proto = LokiWorkerMock.prototype;

  _proto.postMessage = function postMessage(data) {
    var message = {
      data: clone(data)
    };

    this._workerContext.onmessage(message);
  };

  return LokiWorkerMock;
}();

exports.default = LokiWorkerMock;