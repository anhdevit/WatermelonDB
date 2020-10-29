"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _common = require("../../../utils/common");

var Q = _interopRequireWildcard(require("../../../QueryDescription"));

var _encodeValue = _interopRequireDefault(require("../encodeValue"));

var _encodeName = _interopRequireDefault(require("../encodeName"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if ("function" !== typeof WeakMap) return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (null != obj) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/* eslint-disable no-use-before-define */
function mapJoin(array, mapper, joiner) {
  // NOTE: DO NOT try to optimize this by concatenating strings together. In non-JIT JSC,
  // concatenating strings is extremely slow (5000ms vs 120ms on 65K sample)
  return array.map(mapper).join(joiner);
}

var encodeValues = function (values) {
  return "(".concat(mapJoin(values, _encodeValue.default, ', '), ")");
};

var getComparisonRight = function (table, comparisonRight) {
  if (comparisonRight.values) {
    return encodeValues(comparisonRight.values);
  } else if (comparisonRight.column) {
    return "".concat((0, _encodeName.default)(table), ".").concat((0, _encodeName.default)(comparisonRight.column));
  }

  return 'undefined' !== typeof comparisonRight.value ? (0, _encodeValue.default)(comparisonRight.value) : 'null';
}; // Note: it's necessary to use `is` / `is not` for NULL comparisons to work correctly
// See: https://sqlite.org/lang_expr.html


var operators = {
  eq: 'is',
  notEq: 'is not',
  gt: '>',
  gte: '>=',
  weakGt: '>',
  // For non-column comparison case
  lt: '<',
  lte: '<=',
  oneOf: 'in',
  notIn: 'not in',
  between: 'between',
  like: 'like',
  notLike: 'not like'
};

var encodeComparison = function (table, comparison) {
  if ('between' === comparison.operator) {
    var {
      right: right
    } = comparison;
    return right.values ? "between ".concat((0, _encodeValue.default)(right.values[0]), " and ").concat((0, _encodeValue.default)(right.values[1])) : '';
  }

  return "".concat(operators[comparison.operator], " ").concat(getComparisonRight(table, comparison.right));
};

var encodeWhere = function (table, associations) {
  return function (where) {
    switch (where.type) {
      case 'and':
        return "(".concat(encodeAndOr(associations, 'and', table, where.conditions), ")");

      case 'or':
        return "(".concat(encodeAndOr(associations, 'or', table, where.conditions), ")");

      case 'where':
        return encodeWhereCondition(associations, table, where.left, where.comparison);

      case 'on':
        (0, _common.invariant)(associations.some(function ({
          to: to
        }) {
          return to === where.table;
        }), 'To nest Q.on inside Q.and/Q.or you must explicitly declare Q.experimentalJoinTables at the beginning of the query');
        return "(".concat(encodeAndOr(associations, 'and', where.table, where.conditions), ")");

      case 'sql':
        return where.expr;

      default:
        throw new Error("Unknown clause ".concat(where.type));
    }
  };
};

var encodeWhereCondition = function (associations, table, left, comparison) {
  // if right operand is a value, we can use simple comparison
  // if a column, we must check for `not null > null`
  if ('weakGt' === comparison.operator && comparison.right.column) {
    return encodeWhere(table, associations)(Q.or(Q.where(left, Q.gt(Q.column(comparison.right.column))), Q.and(Q.where(left, Q.notEq(null)), Q.where(comparison.right.column, null))));
  }

  return "".concat((0, _encodeName.default)(table), ".").concat((0, _encodeName.default)(left), " ").concat(encodeComparison(table, comparison));
};

var encodeAndOr = function (associations, op, table, conditions) {
  if (conditions.length) {
    return mapJoin(conditions, encodeWhere(table, associations), " ".concat(op, " "));
  }

  return '';
};

var andJoiner = ' and ';

var encodeConditions = function (table, description, associations) {
  var clauses = mapJoin(description.where, encodeWhere(table, associations), andJoiner);
  return clauses.length ? " where ".concat(clauses) : '';
}; // If query contains `on()` conditions on tables with which the primary table has a has-many
// relation, then we need to add `distinct` on the query to ensure there are no duplicates


var encodeMethod = function (table, countMode, needsDistinct) {
  if (countMode) {
    return needsDistinct ? "select count(distinct ".concat((0, _encodeName.default)(table), ".\"id\") as \"count\" from ").concat((0, _encodeName.default)(table)) : "select count(*) as \"count\" from ".concat((0, _encodeName.default)(table));
  }

  return needsDistinct ? "select distinct ".concat((0, _encodeName.default)(table), ".* from ").concat((0, _encodeName.default)(table)) : "select ".concat((0, _encodeName.default)(table), ".* from ").concat((0, _encodeName.default)(table));
};

var encodeAssociation = function (description) {
  return function ({
    from: mainTable,
    to: joinedTable,
    info: association
  }) {
    // TODO: We have a problem here. For all of eternity, WatermelonDB Q.ons were encoded using JOIN
    // However, this precludes many legitimate use cases for Q.ons once you start nesting them
    // (e.g. get tasks where X or has a tag assignment that Y -- if there is no tag assignment, this will
    // fail to join)
    // LEFT JOIN needs to be used to address this… BUT technically that's a breaking change. I never
    // considered a possiblity of making a query like `Q.on(relation_id, x != 'bla')`. Before this would
    // only match if there IS a relation, but with LEFT JOIN it would also match if record does not have
    // this relation. I don't know if there are legitimate use cases where this would change anything
    // so I need more time to think about whether this breaking change is OK to make or if we need to
    // do something more clever/add option/whatever.
    // so for now, i'm making an extreeeeemelyyyy bad hack to make sure that there's no breaking change
    // for existing code and code with nested Q.ons probably works (with caveats)
    var usesOldJoinStyle = description.where.some(function (clause) {
      return 'on' === clause.type && clause.table === joinedTable;
    });
    var joinKeyword = usesOldJoinStyle ? ' join ' : ' left join ';
    var joinBeginning = "".concat(joinKeyword).concat((0, _encodeName.default)(joinedTable), " on ").concat((0, _encodeName.default)(joinedTable), ".");
    return 'belongs_to' === association.type ? "".concat(joinBeginning, "\"id\" = ").concat((0, _encodeName.default)(mainTable), ".").concat((0, _encodeName.default)(association.key)) : "".concat(joinBeginning).concat((0, _encodeName.default)(association.foreignKey), " = ").concat((0, _encodeName.default)(mainTable), ".\"id\"");
  };
};

var encodeJoin = function (description, associations) {
  return associations.length ? associations.map(encodeAssociation(description)).join('') : '';
};

var encodeOrderBy = function (table, sortBys) {
  if (0 === sortBys.length) {
    return '';
  }

  var orderBys = sortBys.map(function (sortBy) {
    return "".concat((0, _encodeName.default)(table), ".").concat((0, _encodeName.default)(sortBy.sortColumn), " ").concat(sortBy.sortOrder);
  }).join(', ');
  return " order by ".concat(orderBys);
};

var encodeLimitOffset = function (limit, offset) {
  if (!limit) {
    return '';
  }

  var optionalOffsetStmt = offset ? " offset ".concat(offset) : '';
  return " limit ".concat(limit).concat(optionalOffsetStmt);
};

var encodeQuery = function (query, countMode = false) {
  var {
    table: table,
    description: description,
    associations: associations
  } = query;
  var hasToManyJoins = associations.some(function ({
    info: info
  }) {
    return 'has_many' === info.type;
  });
  description.take && (0, _common.invariant)(!countMode, 'take/skip is not currently supported with counting. Please contribute to fix this!');
  (0, _common.invariant)(!description.lokiFilter, 'unsafeLokiFilter not supported with SQLite');
  var sql = encodeMethod(table, countMode, hasToManyJoins) + encodeJoin(description, associations) + encodeConditions(table, description, associations) + encodeOrderBy(table, description.sortBy) + encodeLimitOffset(description.take, description.skip);
  return sql;
};

var _default = encodeQuery;
exports.default = _default;