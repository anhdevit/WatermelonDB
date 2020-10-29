"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.eq = eq;
exports.notEq = notEq;
exports.gt = gt;
exports.gte = gte;
exports.weakGt = weakGt;
exports.lt = lt;
exports.lte = lte;
exports.oneOf = oneOf;
exports.notIn = notIn;
exports.between = between;
exports.like = like;
exports.notLike = notLike;
exports.sanitizeLikeString = sanitizeLikeString;
exports.column = column;
exports.where = where;
exports.unsafeSqlExpr = unsafeSqlExpr;
exports.unsafeLokiExpr = unsafeLokiExpr;
exports.unsafeLokiFilter = unsafeLokiFilter;
exports.and = and;
exports.or = or;
exports.experimentalSortBy = experimentalSortBy;
exports.experimentalTake = experimentalTake;
exports.experimentalSkip = experimentalSkip;
exports.experimentalJoinTables = experimentalJoinTables;
exports.experimentalNestedJoin = experimentalNestedJoin;
exports.buildQueryDescription = buildQueryDescription;
exports.queryWithoutDeleted = queryWithoutDeleted;
exports.hasColumnComparisons = hasColumnComparisons;
exports.on = exports.desc = exports.asc = void 0;

var _rambdax = require("rambdax");

var _fp = require("../utils/fp");

var _invariant = _interopRequireDefault(require("../utils/common/invariant"));

var _checkName = _interopRequireDefault(require("../utils/fp/checkName"));

var _deepFreeze = _interopRequireDefault(require("../utils/common/deepFreeze"));

var _Schema = require("../Schema");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || "[object Arguments]" === Object.prototype.toString.call(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var asc = 'asc';
exports.asc = asc;
var desc = 'desc';
exports.desc = desc;
var columnSymbol = Symbol('Q.column');
var comparisonSymbol = Symbol('QueryComparison'); // Note: These operators are designed to match SQLite semantics
// to ensure that iOS, Android, web, and Query observation yield exactly the same results
//
// - `true` and `false` are equal to `1` and `0`
//   (JS uses true/false, but SQLite uses 1/0)
// - `null`, `undefined`, and missing fields are equal
//   (SQLite queries return null, but newly created records might lack fields)
// - You can only compare columns to values/other columns of the same type
//   (e.g. string to int comparisons are not allowed)
// - numeric comparisons (<, <=, >, >=, between) with null on either side always return false
//   e.g. `null < 2 == false`
// - `null` on the right-hand-side of IN/NOT IN is not allowed
//   e.g. `Q.in([null, 'foo', 'bar'])`
// - `null` on the left-hand-side of IN/NOT IN will always return false
//   e.g. `null NOT IN (1, 2, 3) == false`

function _valueOrColumn(arg) {
  if (null === arg || 'object' !== typeof arg) {
    return {
      value: arg
    };
  }

  if ('string' === typeof arg.column) {
    (0, _invariant.default)(arg.type === columnSymbol, 'Invalid { column: } object passed to Watermelon query. You seem to be passing unsanitized user data to Query builder!');
    return {
      column: arg.column
    };
  }

  throw new Error("Invalid value passed to query");
} // Equals (weakly)
// Note:
// - (null == undefined) == true
// - (1 == true) == true
// - (0 == false) == true


function eq(valueOrColumn) {
  return {
    operator: 'eq',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Not equal (weakly)
// Note:
// - (null != undefined) == false
// - (1 != true) == false
// - (0 != false) == false


function notEq(valueOrColumn) {
  return {
    operator: 'notEq',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Greater than (SQLite semantics)
// Note:
// - (5 > null) == false


function gt(valueOrColumn) {
  return {
    operator: 'gt',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Greater than or equal (SQLite semantics)
// Note:
// - (5 >= null) == false


function gte(valueOrColumn) {
  return {
    operator: 'gte',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Greater than (JavaScript semantics)
// Note:
// - (5 > null) == true


function weakGt(valueOrColumn) {
  return {
    operator: 'weakGt',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Less than (SQLite semantics)
// Note:
// - (null < 5) == false


function lt(valueOrColumn) {
  return {
    operator: 'lt',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Less than or equal (SQLite semantics)
// Note:
// - (null <= 5) == false


function lte(valueOrColumn) {
  return {
    operator: 'lte',
    right: _valueOrColumn(valueOrColumn),
    type: comparisonSymbol
  };
} // Value in a set (SQLite IN semantics)
// Note:
// - `null` in `values` is not allowed!


function oneOf(values) {
  (0, _invariant.default)(Array.isArray(values), "argument passed to oneOf() is not an array");
  Object.freeze(values); // even in production, because it's an easy mistake to make

  return {
    operator: 'oneOf',
    right: {
      values: values
    },
    type: comparisonSymbol
  };
} // Value not in a set (SQLite NOT IN semantics)
// Note:
// - `null` in `values` is not allowed!
// - (null NOT IN (1, 2, 3)) == false


function notIn(values) {
  (0, _invariant.default)(Array.isArray(values), "argument passed to notIn() is not an array");
  Object.freeze(values); // even in production, because it's an easy mistake to make

  return {
    operator: 'notIn',
    right: {
      values: values
    },
    type: comparisonSymbol
  };
} // Number is between two numbers (greater than or equal left, and less than or equal right)


function between(left, right) {
  (0, _invariant.default)('number' === typeof left && 'number' === typeof right, 'Values passed to Q.between() are not numbers');
  return {
    operator: 'between',
    right: {
      values: [left, right]
    },
    type: comparisonSymbol
  };
}

function like(value) {
  (0, _invariant.default)('string' === typeof value, 'Value passed to Q.like() is not a string');
  return {
    operator: 'like',
    right: {
      value: value
    },
    type: comparisonSymbol
  };
}

function notLike(value) {
  (0, _invariant.default)('string' === typeof value, 'Value passed to Q.notLike() is not a string');
  return {
    operator: 'notLike',
    right: {
      value: value
    },
    type: comparisonSymbol
  };
}

var nonLikeSafeRegexp = /[^a-zA-Z0-9]/g;

function sanitizeLikeString(value) {
  (0, _invariant.default)('string' === typeof value, 'Value passed to Q.sanitizeLikeString() is not a string');
  return value.replace(nonLikeSafeRegexp, '_');
}

function column(name) {
  (0, _invariant.default)('string' === typeof name, 'Name passed to Q.column() is not a string');
  return {
    column: (0, _checkName.default)(name),
    type: columnSymbol
  };
}

function _valueOrComparison(arg) {
  if (null === arg || 'object' !== typeof arg) {
    return _valueOrComparison(eq(arg));
  }

  (0, _invariant.default)(arg.type === comparisonSymbol, 'Invalid Comparison passed to Query builder. You seem to be passing unsanitized user data to Query builder!');
  var {
    operator: operator,
    right: right
  } = arg;
  return {
    operator: operator,
    right: right
  };
}

function where(left, valueOrComparison) {
  return {
    type: 'where',
    left: (0, _checkName.default)(left),
    comparison: _valueOrComparison(valueOrComparison)
  };
}

function unsafeSqlExpr(sql) {
  (0, _invariant.default)('string' === typeof sql, 'Value passed to Q.unsafeSqlExpr is not a string');
  return {
    type: 'sql',
    expr: sql
  };
}

function unsafeLokiExpr(expr) {
  (0, _invariant.default)(expr && 'object' === typeof expr && !Array.isArray(expr), 'Value passed to Q.unsafeLokiExpr is not an object');
  return {
    type: 'loki',
    expr: expr
  };
}

function unsafeLokiFilter(fn) {
  return {
    type: 'lokiFilter',
    function: fn
  };
}

var acceptableClauses = ['where', 'and', 'or', 'on', 'sql', 'loki'];

var isAcceptableClause = function (clause) {
  return acceptableClauses.includes(clause.type);
};

var validateConditions = function (clauses) {
  (0, _invariant.default)(clauses.every(isAcceptableClause), 'Q.and(), Q.or(), Q.on() can only contain: Q.where, Q.and, Q.or, Q.on, Q.unsafeSqlExpr, Q.unsafeLokiExpr clauses');
};

function and(...clauses) {
  validateConditions(clauses);
  return {
    type: 'and',
    conditions: clauses
  };
}

function or(...clauses) {
  validateConditions(clauses);
  return {
    type: 'or',
    conditions: clauses
  };
}

function experimentalSortBy(sortColumn, sortOrder = asc) {
  (0, _invariant.default)('asc' === sortOrder || 'desc' === sortOrder, "Invalid sortOrder argument received in Q.sortBy (valid: asc, desc)");
  return {
    type: 'sortBy',
    sortColumn: (0, _checkName.default)(sortColumn),
    sortOrder: sortOrder
  };
}

function experimentalTake(count) {
  (0, _invariant.default)('number' === typeof count, 'Value passed to Q.take() is not a number');
  return {
    type: 'take',
    count: count
  };
}

function experimentalSkip(count) {
  (0, _invariant.default)('number' === typeof count, 'Value passed to Q.skip() is not a number');
  return {
    type: 'skip',
    count: count
  };
} // Note: we have to write out three separate meanings of OnFunction because of a Babel bug
// (it will remove the parentheses, changing the meaning of the flow type)


// Use: on('tableName', 'left_column', 'right_value')
// or: on('tableName', 'left_column', gte(10))
// or: on('tableName', where('left_column', 'value')))
// or: on('tableName', or(...))
// or: on('tableName', [where(...), where(...)])
var on = function (table, leftOrClauseOrList, valueOrComparison) {
  if ('string' === typeof leftOrClauseOrList) {
    (0, _invariant.default)(valueOrComparison !== undefined, 'illegal `undefined` passed to Q.on');
    return on(table, [where(leftOrClauseOrList, valueOrComparison)]);
  }

  var clauseOrList = leftOrClauseOrList;

  if (Array.isArray(clauseOrList)) {
    var conditions = clauseOrList;
    validateConditions(conditions);
    return {
      type: 'on',
      table: (0, _checkName.default)(table),
      conditions: conditions
    };
  } else if (clauseOrList && 'and' === clauseOrList.type) {
    return on(table, clauseOrList.conditions);
  }

  return on(table, [clauseOrList]);
};

exports.on = on;

function experimentalJoinTables(tables) {
  (0, _invariant.default)(Array.isArray(tables), 'experimentalJoinTables expected an array');
  return {
    type: 'joinTables',
    tables: tables.map(_checkName.default)
  };
}

function experimentalNestedJoin(from, to) {
  return {
    type: 'nestedJoinTable',
    from: (0, _checkName.default)(from),
    to: (0, _checkName.default)(to)
  };
}

var compressTopLevelOns = function (conditions) {
  // Multiple separate Q.ons is a legacy syntax producing suboptimal query code unless
  // special cases are used. Here, we're special casing only top-level Q.ons to avoid regressions
  // but it's not recommended for new code
  // TODO: Remove this special case
  var [ons, wheres] = (0, _rambdax.partition)(function (clause) {
    return 'on' === clause.type;
  }, conditions);
  var grouppedOns = (0, _rambdax.piped)(ons, (0, _rambdax.groupBy)(function (clause) {
    return clause.table;
  }), Object.values, (0, _rambdax.map)(function (clauses) {
    var {
      table: table
    } = clauses[0];
    var onConditions = (0, _fp.unnest)(clauses.map(function (clause) {
      return clause.conditions;
    }));
    return on(table, onConditions);
  }));
  return grouppedOns.concat(wheres);
};

var syncStatusColumn = (0, _Schema.columnName)('_status');

var extractClauses = function (clauses) {
  var clauseMap = {
    where: [],
    joinTables: [],
    nestedJoinTables: [],
    sortBy: []
  };
  clauses.forEach(function (clause) {
    var _clauseMap$joinTables;

    var {
      type: type
    } = clause;

    switch (type) {
      case 'where':
      case 'and':
      case 'or':
      case 'sql':
      case 'loki':
        clauseMap.where.push(clause);
        break;

      case 'on':
        // $FlowFixMe
        clauseMap.joinTables.push(clause.table);
        clauseMap.where.push(clause);
        break;

      case 'sortBy':
        clauseMap.sortBy.push(clause);
        break;

      case 'take':
        // $FlowFixMe
        clauseMap.take = clause.count;
        break;

      case 'skip':
        // $FlowFixMe
        clauseMap.skip = clause.count;
        break;

      case 'joinTables':
        // $FlowFixMe
        (_clauseMap$joinTables = clauseMap.joinTables).push.apply(_clauseMap$joinTables, _toConsumableArray(clause.tables));

        break;

      case 'nestedJoinTable':
        // $FlowFixMe
        clauseMap.nestedJoinTables.push({
          from: clause.from,
          to: clause.to
        });
        break;

      case 'lokiFilter':
        // $FlowFixMe
        clauseMap.lokiFilter = clause.function;
        break;

      default:
        throw new Error('Invalid Query clause passed');
    }
  });
  clauseMap.joinTables = (0, _rambdax.uniq)(clauseMap.joinTables); // $FlowFixMe

  clauseMap.where = compressTopLevelOns(clauseMap.where); // $FlowFixMe: Flow is too dumb to realize that it is valid

  return clauseMap;
};

function buildQueryDescription(clauses) {
  var query = extractClauses(clauses);
  (0, _invariant.default)(!(query.skip && !query.take), 'cannot skip without take');

  if ('production' !== process.env.NODE_ENV) {
    (0, _deepFreeze.default)(query);
  }

  return query;
}

var whereNotDeleted = where(syncStatusColumn, notEq('deleted'));

function conditionsWithoutDeleted(conditions) {
  return conditions.map(queryWithoutDeletedImpl);
}

function queryWithoutDeletedImpl(clause) {
  if ('and' === clause.type) {
    return {
      type: 'and',
      conditions: conditionsWithoutDeleted(clause.conditions)
    };
  } else if ('or' === clause.type) {
    return {
      type: 'or',
      conditions: conditionsWithoutDeleted(clause.conditions)
    };
  } else if ('on' === clause.type) {
    var onClause = clause;
    return {
      type: 'on',
      table: onClause.table,
      conditions: conditionsWithoutDeleted(onClause.conditions).concat(whereNotDeleted)
    };
  }

  return clause;
}

function queryWithoutDeleted(query) {
  var {
    where: whereConditions
  } = query;

  var newQuery = _objectSpread({}, query, {
    where: conditionsWithoutDeleted(whereConditions).concat(whereNotDeleted)
  });

  if ('production' !== process.env.NODE_ENV) {
    (0, _deepFreeze.default)(newQuery);
  }

  return newQuery;
}

var searchForColumnComparisons = function (value) {
  // Performance critical (100ms on login in previous rambdax-based implementation)
  if (Array.isArray(value)) {
    // dig deeper into the array
    for (var i = 0; i < value.length; i += 1) {
      if (searchForColumnComparisons(value[i])) {
        return true;
      }
    }

    return false;
  } else if (value && 'object' === typeof value) {
    if (value.column) {
      return true; // bingo!
    } // drill deeper into the object
    // eslint-disable-next-line no-restricted-syntax


    for (var key in value) {
      // NOTE: To be safe against JS edge cases, there should be hasOwnProperty check
      // but this is performance critical so we trust that this is only called with
      // QueryDescription which doesn't need that
      if ('values' !== key && searchForColumnComparisons(value[key])) {
        return true;
      }
    }

    return false;
  } // primitive value


  return false;
};

function hasColumnComparisons(conditions) {
  // since we don't do hasOwnProperty check, let's make sure Object prototype isn't broken
  var isBroken = false; // eslint-disable-next-line

  for (var _ in {}) {
    isBroken = true;
  }

  (0, _invariant.default)(!isBroken, 'Broken Object prototype! You must not have properties defined on Object prototype');
  return searchForColumnComparisons(conditions);
}