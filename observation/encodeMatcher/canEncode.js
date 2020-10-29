"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = canEncodeMatcher;
exports.forbiddenError = void 0;
var forbiddenError = "Queries with joins, sortBy, take, skip, lokiFilter can't be encoded into a matcher";
exports.forbiddenError = forbiddenError;

function canEncodeMatcher(query) {
  var {
    joinTables: joinTables,
    nestedJoinTables: nestedJoinTables,
    sortBy: sortBy,
    take: take,
    skip: skip,
    lokiFilter: lokiFilter
  } = query;
  return !joinTables.length && !nestedJoinTables.length && !sortBy.length && !take && !skip && !lokiFilter;
}