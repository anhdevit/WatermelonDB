"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = encodeMatcher;

var _rambdax = require("rambdax");

var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));

var _operators = _interopRequireDefault(require("./operators"));

var _canEncode = _interopRequireWildcard(require("./canEncode"));

function _getRequireWildcardCache() { if ("function" !== typeof WeakMap) return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (null != obj) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-use-before-define */
var encodeWhereDescription = function (description) {
  return function (rawRecord) {
    var left = rawRecord[description.left];
    var {
      comparison: comparison
    } = description;
    var operator = _operators.default[comparison.operator];
    var compRight = comparison.right;
    var right; // TODO: What about `undefined`s ?

    if (compRight.value !== undefined) {
      right = compRight.value;
    } else if (compRight.values) {
      right = compRight.values;
    } else if (compRight.column) {
      right = rawRecord[compRight.column];
    } else {
      throw new Error('Invalid comparisonRight');
    }

    return operator(left, right);
  };
};

var encodeWhere = function (where) {
  switch (where.type) {
    case 'where':
      return encodeWhereDescription(where);

    case 'and':
      return (0, _rambdax.allPass)(where.conditions.map(encodeWhere));

    case 'or':
      return (0, _rambdax.anyPass)(where.conditions.map(encodeWhere));

    case 'on':
      throw new Error('Illegal Q.on found -- nested Q.ons require explicit Q.experimentalJoinTables declaration');

    default:
      throw new Error("Illegal clause ".concat(where.type));
  }
};

var encodeConditions = (0, _rambdax.pipe)((0, _rambdax.map)(encodeWhere), _rambdax.allPass);

function encodeMatcher(query) {
  (0, _invariant.default)((0, _canEncode.default)(query), _canEncode.forbiddenError);
  return encodeConditions(query.where);
}