"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkName;

var _invariant = _interopRequireDefault(require("../../common/invariant"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var safeNameCharacters = /^[a-zA-Z_]\w*$/;
var knownSafeNames = new Set();

function checkName(name) {
  if (knownSafeNames.has(name)) {
    return name;
  }

  (0, _invariant.default)('string' === typeof name, "Unsafe name '".concat(name, "' not allowed (not a string)"));
  (0, _invariant.default)(!['__proto__', 'constructor', 'prototype', 'hasOwnProperty', 'isPrototypeOf', 'toString', 'toLocaleString', 'valueOf'].includes(name), "Unsafe name '".concat(name, "' not allowed (Object prototype property)"));
  (0, _invariant.default)('$loki' !== name.toLowerCase(), "Unsafe name '".concat(name, "' not allowed (reserved for LokiJS compatibility)"));
  (0, _invariant.default)(!['rowid', 'oid', '_rowid_', 'sqlite_master'].includes(name.toLowerCase()), "Unsafe name '".concat(name, "' not allowed (reserved for SQLite compatibility)"));
  (0, _invariant.default)(!name.toLowerCase().startsWith('sqlite_stat'), "Unsafe name '".concat(name, "' not allowed (reserved for SQLite compatibility)"));
  (0, _invariant.default)(!name.startsWith('__'), "Unsafe name '".concat(name, "' not allowed (names starting with '__' are reserved for internal purposes)"));
  (0, _invariant.default)(safeNameCharacters.test(name), "Unsafe name '".concat(name, "' not allowed (names must contain only safe characters ").concat(safeNameCharacters.toString(), ")"));
  knownSafeNames.add(name);
  return name;
}