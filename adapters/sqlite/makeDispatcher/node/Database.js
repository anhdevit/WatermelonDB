"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require("fs");

var SQliteDatabase = require('better-sqlite3');

var Database =
/*#__PURE__*/
function () {
  function Database(_path = ':memory:') {
    var _this = this;

    this.instance = undefined;

    this.open = function () {
      var {
        path: path
      } = _this;

      if ('file::memory:' === path || 0 <= path.indexOf('?mode=memory')) {
        path = ':memory:';
      }

      try {
        // eslint-disable-next-line no-console
        _this.instance = new SQliteDatabase(path, {
          verboze: function verboze() {}
        });
      } catch (error) {
        throw new Error("Failed to open the database. - ".concat(error.message));
      }

      if (!_this.instance || !_this.instance.open) {
        throw new Error('Failed to open the database.');
      }
    };

    this.inTransaction = function (executeBlock) {
      return _this.instance.transaction(executeBlock)();
    };

    this.execute = function (query, args = []) {
      return _this.instance.prepare(query).run(args);
    };

    this.executeStatements = function (queries) {
      return _this.instance.exec(queries);
    };

    this.queryRaw = function (query, args = []) {
      var results = [];

      var stmt = _this.instance.prepare(query);

      if (stmt.get(args)) {
        results = stmt.all(args);
      }

      return results;
    };

    this.count = function (query, args = []) {
      var results = _this.instance.prepare(query).all(args);

      if (0 === results.length) {
        throw new Error('Invalid count query, can`t find next() on the result');
      }

      var result = results[0];

      if (result.count === undefined) {
        throw new Error('Invalid count query, can`t find `count` column');
      }

      return Number.parseInt(result.count, 10);
    };

    this.getUserVersion = function () {
      return _this.instance.pragma('user_version', {
        simple: true
      });
    };

    this.unsafeDestroyEverything = function () {
      // Deleting files by default because it seems simpler, more reliable
      // And we have a weird problem with sqlite code 6 (database busy) in sync mode
      // But sadly this won't work for in-memory (shared) databases, so in those cases,
      // drop all tables, indexes, and reset user version to 0
      if (_this.isInMemoryDatabase()) {
        _this.inTransaction(function () {
          var results = _this.queryRaw("SELECT * FROM sqlite_master WHERE type = 'table'");

          var tables = results.map(function (table) {
            return table.name;
          });
          tables.forEach(function (table) {
            _this.execute("DROP TABLE IF EXISTS '".concat(table, "'"));
          });

          _this.execute('PRAGMA writable_schema=1');

          var count = _this.queryRaw("SELECT * FROM sqlite_master").length;

          if (count) {
            // IF required to avoid SQLIte Error
            _this.execute('DELETE FROM sqlite_master');
          }

          _this.execute('PRAGMA user_version=0');

          _this.execute('PRAGMA writable_schema=0');
        });
      } else {
        _this.instance.close();

        if (_this.instance.open) {
          throw new Error('Could not close database');
        }

        if (fs.existsSync(_this.path)) {
          fs.unlinkSync(_this.path);
        }

        if (fs.existsSync("".concat(_this.path, "-wal"))) {
          fs.unlinkSync("".concat(_this.path, "-wal"));
        }

        if (fs.existsSync("".concat(_this.path, "-shm"))) {
          fs.unlinkSync("".concat(_this.path, "-shm"));
        }

        _this.open();
      }
    };

    this.isInMemoryDatabase = function () {
      return _this.instance.memory;
    };

    this.path = _path; // this.instance = new SQliteDatabase(path);

    this.open();
  }

  _createClass(Database, [{
    key: "userVersion",
    get: function get() {
      return this.getUserVersion();
    },
    set: function set(version) {
      this.instance.pragma("user_version = ".concat(version));
      return this.getUserVersion();
    }
  }]);

  return Database;
}();

var _default = Database;
exports.default = _default;