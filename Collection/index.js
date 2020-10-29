"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Observable = require("rxjs/Observable");

var _Subject = require("rxjs/Subject");

var _invariant = _interopRequireDefault(require("../utils/common/invariant"));

var _noop = _interopRequireDefault(require("../utils/fp/noop"));

var _Result = require("../utils/fp/Result");

var _Query = _interopRequireDefault(require("../Query"));

var _RecordCache = _interopRequireDefault(require("./RecordCache"));

var _common = require("./common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Collection =
/*#__PURE__*/
function () {
  // Emits event every time a record inside Collection changes or is deleted
  // (Use Query API to observe collection changes)
  function Collection(database, ModelClass) {
    var _this = this;

    this.changes = new _Subject.Subject();
    this._subscribers = [];
    this.database = database;
    this.modelClass = ModelClass;
    this._cache = new _RecordCache.default(ModelClass.table, function (raw) {
      return new ModelClass(_this, raw);
    });
  }

  var _proto = Collection.prototype;

  // Finds a record with the given ID
  // Promise will reject if not found
  _proto.find = function find(id) {
    return new Promise(function ($return) {
      var _this2 = this;

      return $return((0, _Result.toPromise)(function (callback) {
        return _this2._fetchRecord(id, callback);
      }));
    }.bind(this));
  } // Finds the given record and starts observing it
  // (with the same semantics as when calling `model.observe()`)
  ;

  _proto.findAndObserve = function findAndObserve(id) {
    var _this3 = this;

    return _Observable.Observable.create(function (observer) {
      var unsubscribe = null;
      var unsubscribed = false;

      _this3._fetchRecord(id, function (result) {
        if (result.value) {
          var record = result.value;
          observer.next(record);
          unsubscribe = record.experimentalSubscribe(function (isDeleted) {
            if (!unsubscribed) {
              isDeleted ? observer.complete() : observer.next(record);
            }
          });
        } else {
          observer.error(result.error);
        }
      });

      return function () {
        unsubscribed = true;
        unsubscribe && unsubscribe();
      };
    });
  } // Query records of this type
  ;

  _proto.query = function query(...clauses) {
    return new _Query.default(this, clauses);
  } // Creates a new record in this collection
  // Pass a function to set attributes of the record.
  //
  // Example:
  // collections.get(Tables.tasks).create(task => {
  //   task.name = 'Task name'
  // })
  ;

  _proto.create = function create(recordBuilder = _noop.default) {
    return new Promise(function ($return, $error) {
      var record;

      this.database._ensureInAction("Collection.create() can only be called from inside of an Action. See docs for more details.");

      record = this.prepareCreate(recordBuilder);
      return Promise.resolve(this.database.batch(record)).then(function () {
        try {
          return $return(record);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  } // Prepares a new record in this collection
  // Use this to batch-create multiple records
  ;

  _proto.prepareCreate = function prepareCreate(recordBuilder = _noop.default) {
    return this.modelClass._prepareCreate(this, recordBuilder);
  } // Prepares a new record in this collection based on a raw object
  // e.g. `{ foo: 'bar' }`. Don't use this unless you know how RawRecords work in WatermelonDB
  // this is useful as a performance optimization or if you're implementing your own sync mechanism
  ;

  _proto.prepareCreateFromDirtyRaw = function prepareCreateFromDirtyRaw(dirtyRaw) {
    return this.modelClass._prepareCreateFromDirtyRaw(this, dirtyRaw);
  } // *** Implementation of Query APIs ***
  ;

  _proto.unsafeFetchRecordsWithSQL = function unsafeFetchRecordsWithSQL(sql) {
    return new Promise(function ($return, $error) {
      var adapter, rawRecords;
      ({
        adapter: adapter
      } = this.database);
      (0, _invariant.default)('function' === typeof adapter.unsafeSqlQuery, 'unsafeFetchRecordsWithSQL called on database that does not support SQL');
      return Promise.resolve(adapter.unsafeSqlQuery(this.modelClass.table, sql)).then(function ($await_2) {
        try {
          rawRecords = $await_2;
          return $return(this._cache.recordsFromQueryResult(rawRecords));
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }.bind(this));
  } // *** Implementation details ***
  ;

  // See: Query.fetch
  _proto._fetchQuery = function _fetchQuery(query, callback) {
    var _this4 = this;

    this.database.adapter.underlyingAdapter.query(query.serialize(), function (result) {
      return callback((0, _Result.mapValue)(function (rawRecords) {
        return _this4._cache.recordsFromQueryResult(rawRecords);
      }, result));
    });
  } // See: Query.fetchCount
  ;

  _proto._fetchCount = function _fetchCount(query, callback) {
    this.database.adapter.underlyingAdapter.count(query.serialize(), callback);
  } // Fetches exactly one record (See: Collection.find)
  ;

  _proto._fetchRecord = function _fetchRecord(id, callback) {
    var _this5 = this;

    if ('string' !== typeof id) {
      callback({
        error: new Error("Invalid record ID ".concat(this.table, "#").concat(id))
      });
      return;
    }

    var cachedRecord = this._cache.get(id);

    if (cachedRecord) {
      callback({
        value: cachedRecord
      });
      return;
    }

    this.database.adapter.underlyingAdapter.find(this.table, id, function (result) {
      return callback((0, _Result.mapValue)(function (rawRecord) {
        (0, _invariant.default)(rawRecord, "Record ".concat(_this5.table, "#").concat(id, " not found"));
        return _this5._cache.recordFromQueryResult(rawRecord);
      }, result));
    });
  };

  _proto._applyChangesToCache = function _applyChangesToCache(operations) {
    var _this6 = this;

    operations.forEach(function ({
      record: record,
      type: type
    }) {
      if (type === _common.CollectionChangeTypes.created) {
        record._isCommitted = true;

        _this6._cache.add(record);
      } else if (type === _common.CollectionChangeTypes.destroyed) {
        _this6._cache.delete(record);
      }
    });
  };

  _proto._notify = function _notify(operations) {
    this._subscribers.forEach(function collectionChangeNotifySubscribers([subscriber]) {
      subscriber(operations);
    });

    this.changes.next(operations);
    operations.forEach(function collectionChangeNotifyModels({
      record: record,
      type: type
    }) {
      if (type === _common.CollectionChangeTypes.updated) {
        record._notifyChanged();
      } else if (type === _common.CollectionChangeTypes.destroyed) {
        record._notifyDestroyed();
      }
    });
  };

  _proto.experimentalSubscribe = function experimentalSubscribe(subscriber, debugInfo) {
    var _this7 = this;

    var entry = [subscriber, debugInfo];

    this._subscribers.push(entry);

    return function () {
      var idx = _this7._subscribers.indexOf(entry);

      -1 !== idx && _this7._subscribers.splice(idx, 1);
    };
  } // See: Database.unsafeClearCaches
  ;

  _proto.unsafeClearCache = function unsafeClearCache() {
    this._cache.unsafeClear();
  };

  _createClass(Collection, [{
    key: "db",
    get: function get() {
      return this.database;
    }
  }, {
    key: "table",
    get: function get() {
      return this.modelClass.table;
    }
  }, {
    key: "schema",
    get: function get() {
      return this.database.schema.tables[this.table];
    }
  }]);

  return Collection;
}();

exports.default = Collection;