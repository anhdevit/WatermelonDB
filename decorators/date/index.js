"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _makeDecorator = _interopRequireDefault(require("../../utils/common/makeDecorator"));

var _memory = require("../../utils/common/memory");

var _common = require("../common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache = new Map();
(0, _memory.onLowMemory)(function () {
  return cache.clear();
});
var dateDecorator = (0, _makeDecorator.default)(function (columnName) {
  return function (target, key, descriptor) {
    (0, _common.ensureDecoratorUsedProperly)(columnName, target, key, descriptor);
    return {
      configurable: true,
      enumerable: true,
      get: function get() {
        var rawValue = this.asModel._getRaw(columnName);

        if ('number' === typeof rawValue) {
          var cached = cache.get(rawValue);

          if (cached) {
            return cached;
          }

          var date = new Date(rawValue);
          cache.set(rawValue, date);
          return date;
        }

        return null;
      },
      set: function set(date) {
        var rawValue = date ? +new Date(date) : null;

        if (rawValue && date) {
          cache.set(rawValue, new Date(date));
        }

        this.asModel._setRaw(columnName, rawValue);
      }
    };
  };
});
var _default = dateDecorator;
exports.default = _default;