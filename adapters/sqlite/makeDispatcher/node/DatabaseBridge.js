"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _DatabaseDriver = _interopRequireDefault(require("./DatabaseDriver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DatabaseBridge = function () {
  var _this = this;

  this.connections = {};

  this.connected = function (tag, driver, synchronous = false) {
    _this.connections[tag] = {
      driver: driver,
      synchronous: synchronous,
      queue: [],
      status: 'connected'
    };
  };

  this.waiting = function (tag, driver, synchronous = false) {
    _this.connections[tag] = {
      driver: driver,
      synchronous: synchronous,
      queue: [],
      status: 'waiting'
    };
  };

  this.initialize = function (tag, databaseName, schemaVersion, resolve, reject) {
    var driver;

    try {
      _this.assertNoConnection(tag);

      driver = new _DatabaseDriver.default();
      driver.initialize(databaseName, schemaVersion);

      _this.connected(tag, driver);

      resolve({
        code: 'ok'
      });
    } catch (error) {
      if (driver && 'SchemaNeededError' === error.type) {
        _this.waiting(tag, driver);

        resolve({
          code: 'schema_needed'
        });
      } else if (driver && 'MigrationNeededError' === error.type) {
        _this.waiting(tag, driver);

        resolve({
          code: 'migrations_needed',
          databaseVersion: error.databaseVersion
        });
      } else {
        _this.sendReject(reject, error, 'initialize');
      }
    }
  };

  this.setUpWithSchema = function (tag, databaseName, schema, schemaVersion, resolve) {
    var driver = new _DatabaseDriver.default();
    driver.setUpWithSchema(databaseName, schema, schemaVersion);

    _this.connectDriverAsync(tag, driver);

    resolve(true);
  };

  this.setUpWithMigrations = function (tag, databaseName, migrations, fromVersion, toVersion, resolve, reject) {
    try {
      var _driver = new _DatabaseDriver.default();

      _driver.setUpWithMigrations(databaseName, {
        from: fromVersion,
        to: toVersion,
        sql: migrations
      });

      _this.connectDriverAsync(tag, _driver);

      resolve(true);
    } catch (error) {
      _this.disconnectDriver(tag);

      _this.sendReject(reject, error, 'setUpWithMigrations');
    }
  };

  this.initializeJSI = function () {
    // return this.synchronously('initializeJSI', bridge => {
    //   // swiftlint:disable all
    //   installWatermelonJSI(bridge) //  as? RCTCxxBridge
    // })
    throw new Error('No JSI here');
  };

  this.initializeSynchronous = function (tag, databaseName, schemaVersion) {
    return _this.synchronously('initializeSynchronous', function () {
      var driver;

      try {
        _this.assertNoConnection(tag);

        driver = new _DatabaseDriver.default();
        driver.initialize(databaseName, schemaVersion);

        _this.connected(tag, driver, true);

        return {
          code: 'ok'
        };
      } catch (error) {
        if (driver && 'SchemaNeededError' === error.type) {
          _this.waiting(tag, driver, true);

          return {
            code: 'schema_needed'
          };
        } else if (driver && 'MigrationNeededError' === error.type) {
          _this.waiting(tag, driver, true);

          return {
            code: 'migrations_needed',
            databaseVersion: error.databaseVersion
          };
        }

        throw error;
      }
    });
  };

  this.setUpWithSchemaSynchronous = function (tag, databaseName, schema, schemaVersion) {
    return _this.synchronously('setUpWithSchemaSynchronous', function () {
      var driver = new _DatabaseDriver.default();
      driver.setUpWithSchema(databaseName, schema, schemaVersion);

      _this.connectDriverAsync(tag, driver);

      return true;
    });
  };

  this.setUpWithMigrationsSynchronous = function (tag, databaseName, migrations, fromVersion, toVersion) {
    return _this.synchronously('setUpWithSchemaSynchronous', function () {
      try {
        var _driver2 = new _DatabaseDriver.default();

        _driver2.setUpWithMigrations(databaseName, {
          from: fromVersion,
          to: toVersion,
          sql: migrations
        });

        _this.connectDriverAsync(tag, _driver2);

        return true;
      } catch (error) {
        _this.disconnectDriver(tag);

        throw error;
      }
    });
  };

  this.find = function (tag, table, id, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'find', function (driver) {
      return driver.find(table, id);
    });
  };

  this.query = function (tag, table, query, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'query', function (driver) {
      return driver.cachedQuery(table, query);
    });
  };

  this.count = function (tag, query, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'count', function (driver) {
      return driver.count(query);
    });
  };

  this.batchJSON = function (tag, operations, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'batchJSON', function (driver) {
      return driver.batch(_this.toBatchOperations(operations));
    });
  };

  this.batch = function (tag, operations, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'batch', function (driver) {
      return driver.batch(_this.toBatchOperations(operations));
    });
  };

  this.getDeletedRecords = function (tag, table, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'getDeletedRecords', function (driver) {
      return driver.getDeletedRecords(table);
    });
  };

  this.destroyDeletedRecords = function (tag, table, records, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'destroyDeletedRecords', function (driver) {
      return driver.destroyDeletedRecords(table, records);
    });
  };

  this.unsafeResetDatabase = function (tag, schema, schemaVersion, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'unsafeResetDatabase', function (driver) {
      return driver.unsafeResetDatabase({
        version: schemaVersion,
        sql: schema
      });
    });
  };

  this.getLocal = function (tag, key, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'getLocal', function (driver) {
      return driver.getLocal(key);
    });
  };

  this.setLocal = function (tag, key, value, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'setLocal', function (driver) {
      return driver.setLocal(key, value);
    });
  };

  this.removeLocal = function (tag, key, resolve, reject) {
    return _this.withDriver(tag, resolve, reject, 'removeLocal', function (driver) {
      return driver.removeLocal(key);
    });
  };

  this.findSynchronous = function (tag, table, id) {
    return _this.withDriverSynchronous(tag, 'findSynchronous', function (driver) {
      return driver.find(table, id);
    });
  };

  this.querySynchronous = function (tag, table, query) {
    return _this.withDriverSynchronous(tag, 'querySynchronous', function (driver) {
      var results = driver.cachedQuery(table, query);
      return results;
    });
  };

  this.countSynchronous = function (tag, query) {
    return _this.withDriverSynchronous(tag, 'countSynchronous', function (driver) {
      return driver.count(query);
    });
  };

  this.batchJSONSynchronous = function (tag, operations) {
    return _this.withDriverSynchronous(tag, 'batchJSONSynchronous', function (driver) {
      return driver.batch(_this.toBatchOperations(operations));
    });
  };

  this.batchSynchronous = function (tag, operations) {
    return _this.withDriverSynchronous(tag, 'batchSynchronous', function (driver) {
      return driver.batch(_this.toBatchOperations(operations));
    });
  };

  this.getDeletedRecordsSynchronous = function (tag, table) {
    return _this.withDriverSynchronous(tag, 'getDeletedRecordsSynchronous', function (driver) {
      return driver.getDeletedRecords(table);
    });
  };

  this.destroyDeletedRecordsSynchronous = function (tag, table, records) {
    return _this.withDriverSynchronous(tag, 'destroyDeletedRecordsSynchronous', function (driver) {
      return driver.destroyDeletedRecords(table, records);
    });
  };

  this.unsafeResetDatabaseSynchronous = function (tag, schema, schemaVersion) {
    return _this.withDriverSynchronous(tag, 'unsafeResetDatabaseSynchronous', function (driver) {
      return driver.unsafeResetDatabase({
        version: schemaVersion,
        sql: schema
      });
    });
  };

  this.getLocalSynchronous = function (tag, key) {
    return _this.withDriverSynchronous(tag, 'getLocalSynchronous', function (driver) {
      return driver.getLocal(key);
    });
  };

  this.setLocalSynchronous = function (tag, key, value) {
    return _this.withDriverSynchronous(tag, 'setLocalSynchronous', function (driver) {
      return driver.setLocal(key, value);
    });
  };

  this.removeLocalSynchronous = function (tag, key) {
    return _this.withDriverSynchronous(tag, 'removeLocalSynchronous', function (driver) {
      return driver.removeLocal(key);
    });
  };

  this.toBatchOperations = function (operations) {
    if ('string' === typeof operations) {
      try {
        return JSON.parse(operations);
      } catch (error) {//
      }
    }

    return operations;
  };

  this.withDriver = function (tag, resolve, reject, functionName, action) {
    try {
      var connection = _this.connections[tag];

      if (!connection) {
        throw new Error("No driver for with tag ".concat(tag, " available"));
      }

      if ('connected' === connection.status) {
        if (connection.synchronous) {
          throw new Error("Can't perform async action on synchronous connection ".concat(tag));
        }

        var result = action(connection.driver);
        resolve(result);
      } else if ('waiting' === connection.status) {
        // consoleLog('Operation for driver (tagID) enqueued')
        // try again when driver is ready
        connection.queue.push(function () {
          _this.withDriver(tag, resolve, reject, functionName, action);
        });
      }
    } catch (error) {
      _this.sendReject(reject, error, functionName);
    }
  };

  this.synchronously = function (functionName, action) {
    try {
      var result = action();
      return {
        status: 'success',
        result: result
      };
    } catch (error) {
      return {
        status: 'error',
        code: "db.".concat(functionName, ".error"),
        message: error.message
      };
    }
  };

  this.withDriverSynchronous = function (tag, functionName, action) {
    return _this.synchronously(functionName, function () {
      var connection = _this.connections[tag];

      if (!connection) {
        throw new Error("No or invalid connection for tag ".concat(tag));
      }

      var actionResult = action(connection.driver);
      return actionResult;
    });
  };

  this.connectDriverAsync = function (tag, driver) {
    var {
      queue = []
    } = _this.connections[tag];
    _this.connections[tag] = {
      driver: driver,
      synchronous: false,
      queue: [],
      status: 'connected'
    };
    queue.forEach(function (operation) {
      return operation();
    });
  };

  this.disconnectDriver = function (tag) {
    var {
      queue = []
    } = _this.connections[tag];
    delete _this.connections[tag];
    queue.forEach(function (operation) {
      return operation();
    });
  };

  this.assertNoConnection = function (tag) {
    if (_this.connections[tag]) {
      throw new Error("A driver with tag ".concat(tag, " already set up"));
    }
  };

  this.sendReject = function (reject, error, functionName) {
    if (reject) {
      reject("db.".concat(functionName, ".error"), error.message, error);
    } else {
      throw new Error("db.".concat(functionName, " missing reject (").concat(error.message, ")"));
    }
  };
};

var databaseBridge = new DatabaseBridge();
var _default = databaseBridge;
exports.default = _default;