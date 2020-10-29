"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encodeMigrationSteps = exports.encodeSchema = void 0;

var _rambdax = require("rambdax");

var _RawRecord = require("../../../RawRecord");

var _encodeName = _interopRequireDefault(require("../encodeName"));

var _encodeValue = _interopRequireDefault(require("../encodeValue"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var standardColumns = "\"id\" primary key, \"_changed\", \"_status\"";

var encodeCreateTable = function ({
  name: name,
  columns: columns
}) {
  var columnsSQL = [standardColumns].concat((0, _rambdax.keys)(columns).map(function (column) {
    return (0, _encodeName.default)(column);
  })).join(', ');
  return "create table ".concat((0, _encodeName.default)(name), " (").concat(columnsSQL, ");");
};

var encodeIndex = function (column, tableName) {
  return column.isIndexed ? "create index \"".concat(tableName, "_").concat(column.name, "\" on ").concat((0, _encodeName.default)(tableName), " (").concat((0, _encodeName.default)(column.name), ");") : '';
};

var encodeTableIndicies = function ({
  name: tableName,
  columns: columns
}) {
  return (0, _rambdax.values)(columns).map(function (column) {
    return encodeIndex(column, tableName);
  }).concat(["create index \"".concat(tableName, "__status\" on ").concat((0, _encodeName.default)(tableName), " (\"_status\");")]).join('');
};

var transform = function (sql, transformer) {
  return transformer ? transformer(sql) : sql;
};

var encodeTable = function (table) {
  return transform(encodeCreateTable(table) + encodeTableIndicies(table), table.unsafeSql);
};

var encodeSchema = function ({
  tables: tables,
  unsafeSql: unsafeSql
}) {
  var sql = (0, _rambdax.values)(tables).map(encodeTable).join('');
  return transform(sql, unsafeSql);
};

exports.encodeSchema = encodeSchema;

var encodeCreateTableMigrationStep = function ({
  schema: schema
}) {
  return encodeTable(schema);
};

var encodeAddColumnsMigrationStep = function ({
  table: table,
  columns: columns,
  unsafeSql: unsafeSql
}) {
  return columns.map(function (column) {
    var addColumn = "alter table ".concat((0, _encodeName.default)(table), " add ").concat((0, _encodeName.default)(column.name), ";");
    var setDefaultValue = "update ".concat((0, _encodeName.default)(table), " set ").concat((0, _encodeName.default)(column.name), " = ").concat((0, _encodeValue.default)((0, _RawRecord.nullValue)(column)), ";");
    var addIndex = encodeIndex(column, table);
    return transform(addColumn + setDefaultValue + addIndex, unsafeSql);
  }).join('');
};

var encodeMigrationSteps = function (steps) {
  return steps.map(function (step) {
    if ('create_table' === step.type) {
      return encodeCreateTableMigrationStep(step);
    } else if ('add_columns' === step.type) {
      return encodeAddColumnsMigrationStep(step);
    } else if ('sql' === step.type) {
      return step.sql;
    }

    throw new Error("Unsupported migration step ".concat(step.type));
  }).join('');
};

exports.encodeMigrationSteps = encodeMigrationSteps;