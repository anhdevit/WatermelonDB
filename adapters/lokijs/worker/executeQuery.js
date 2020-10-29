"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = executeQuery;

var _lokijs = _interopRequireDefault(require("lokijs"));

var _encodeQuery = _interopRequireDefault(require("./encodeQuery"));

var _performJoins = _interopRequireDefault(require("./performJoins"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function performJoin(join, loki) {
  var {
    table: table,
    query: query
  } = join;
  var collection = loki.getCollection(table).chain();
  var records = collection.find(query).data();
  return records;
}

function executeQuery(query, loki) {
  var {
    lokiFilter: lokiFilter
  } = query.description; // Step one: perform all inner queries (JOINs) to get the single table query

  var lokiQuery = (0, _encodeQuery.default)(query);
  var mainQuery = (0, _performJoins.default)(lokiQuery, function (join) {
    return performJoin(join, loki);
  }); // Step two: fetch all records matching query

  var collection = loki.getCollection(query.table).chain();
  var results = collection.find(mainQuery); // Step three: execute extra filter, if passed in query

  if (lokiFilter) {
    return results.where(function (rawRecord) {
      return lokiFilter(rawRecord, loki);
    });
  }

  return results;
}