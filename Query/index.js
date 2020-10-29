"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Observable = require("rxjs/Observable");

var _rambdax = require("rambdax");

var _allPromises = _interopRequireDefault(require("../utils/fp/allPromises"));

var _Result = require("../utils/fp/Result");

var _subscriptions = require("../utils/subscriptions");

var _common = require("../utils/common");

var _lazy = _interopRequireDefault(require("../decorators/lazy"));

var _subscribeToCount = _interopRequireDefault(require("../observation/subscribeToCount"));

var _subscribeToQuery = _interopRequireDefault(require("../observation/subscribeToQuery"));

var _subscribeToQueryWithColumns = _interopRequireDefault(require("../observation/subscribeToQueryWithColumns"));

var Q = _interopRequireWildcard(require("../QueryDescription"));

var _helpers = require("./helpers");

var _class, _descriptor, _descriptor2, _descriptor3, _temp;

function _getRequireWildcardCache() { if ("function" !== typeof WeakMap) return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (null != obj) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || "[object Arguments]" === Object.prototype.toString.call(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && void 0 !== desc.initializer) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (void 0 === desc.initializer) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper() { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

var Query = (_class = (_temp =
/*#__PURE__*/
function () {
  // Note: Don't use this directly, use Collection.query(...)
  function Query(collection, clauses) {
    _initializerDefineProperty(this, "_cachedSubscribable", _descriptor, this);

    _initializerDefineProperty(this, "_cachedCountSubscribable", _descriptor2, this);

    _initializerDefineProperty(this, "_cachedCountThrottledSubscribable", _descriptor3, this);

    this.collection = collection;
    this._rawDescription = Q.buildQueryDescription(clauses);
    this.description = Q.queryWithoutDeleted(this._rawDescription);
  } // Creates a new Query that extends the clauses of this query


  var _proto = Query.prototype;

  _proto.extend = function extend(...clauses) {
    var {
      collection: collection
    } = this;
    var {
      where: where,
      sortBy: sortBy,
      take: take,
      skip: skip,
      joinTables: joinTables,
      nestedJoinTables: nestedJoinTables,
      lokiFilter: lokiFilter
    } = this._rawDescription;
    return new Query(collection, [Q.experimentalJoinTables(joinTables)].concat(_toConsumableArray(nestedJoinTables.map(function ({
      from: from,
      to: to
    }) {
      return Q.experimentalNestedJoin(from, to);
    })), _toConsumableArray(where), _toConsumableArray(sortBy), _toConsumableArray(take ? [Q.experimentalTake(take)] : []), _toConsumableArray(skip ? [Q.experimentalSkip(skip)] : []), _toConsumableArray(lokiFilter ? [Q.unsafeLokiFilter(lokiFilter)] : []), clauses));
  };

  _proto.pipe = function pipe(transform) {
    return transform(this);
  } // Queries database and returns an array of matching records
  ;

  _proto.fetch = function fetch() {
    var _this = this;

    return (0, _Result.toPromise)(function (callback) {
      return _this.collection._fetchQuery(_this, callback);
    });
  };

  _proto.then = function then(onFulfill, onReject) {
    // $FlowFixMe
    return this.fetch().then(onFulfill, onReject);
  } // Emits an array of matching records, then emits a new array every time it changes
  ;

  _proto.observe = function observe() {
    var _this2 = this;

    return _Observable.Observable.create(function (observer) {
      return _this2._cachedSubscribable.subscribe(function (records) {
        observer.next(records);
      });
    });
  } // Same as `observe()` but also emits the list when any of the records
  // on the list has one of `columnNames` chaged
  ;

  _proto.observeWithColumns = function observeWithColumns(columnNames) {
    var _this3 = this;

    return _Observable.Observable.create(function (observer) {
      return _this3.experimentalSubscribeWithColumns(columnNames, function (records) {
        observer.next(records);
      });
    });
  } // Returns the number of matching records
  ;

  _proto.fetchCount = function fetchCount() {
    var _this4 = this;

    return (0, _Result.toPromise)(function (callback) {
      return _this4.collection._fetchCount(_this4, callback);
    });
  };

  // Emits the number of matching records, then emits a new count every time it changes
  // Note: By default, the Observable is throttled!
  _proto.observeCount = function observeCount(isThrottled = true) {
    var _this5 = this;

    return _Observable.Observable.create(function (observer) {
      var subscribable = isThrottled ? _this5._cachedCountThrottledSubscribable : _this5._cachedCountSubscribable;
      return subscribable.subscribe(function (count) {
        observer.next(count);
      });
    });
  };

  _proto.experimentalSubscribe = function experimentalSubscribe(subscriber) {
    return this._cachedSubscribable.subscribe(subscriber);
  };

  _proto.experimentalSubscribeWithColumns = function experimentalSubscribeWithColumns(columnNames, subscriber) {
    return (0, _subscribeToQueryWithColumns.default)(this, columnNames, subscriber);
  };

  _proto.experimentalSubscribeToCount = function experimentalSubscribeToCount(subscriber) {
    return this._cachedCountSubscribable.subscribe(subscriber);
  } // Marks as deleted all records matching the query
  ;

  _proto.markAllAsDeleted = function markAllAsDeleted() {
    return new Promise(function ($return, $error) {
      var records;
      return Promise.resolve(this.fetch()).then(function ($await_1) {
        try {
          records = $await_1;
          return Promise.resolve((0, _allPromises.default)(function (record) {
            return record.markAsDeleted();
          }, records)).then(function () {
            try {
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  } // Destroys all records matching the query
  ;

  _proto.destroyAllPermanently = function destroyAllPermanently() {
    return new Promise(function ($return, $error) {
      var records;
      return Promise.resolve(this.fetch()).then(function ($await_3) {
        try {
          records = $await_3;
          return Promise.resolve((0, _allPromises.default)(function (record) {
            return record.destroyPermanently();
          }, records)).then(function () {
            try {
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  } // MARK: - Internals
  ;

  // Serialized version of Query (e.g. for sending to web worker)
  _proto.serialize = function serialize() {
    var {
      table: table,
      description: description,
      associations: associations
    } = this;
    return {
      table: table,
      description: description,
      associations: associations
    };
  };

  _createClass(Query, [{
    key: "count",
    get: function get() {
      var model = this;
      return {
        then: function then(onFulfill, onReject) {
          // $FlowFixMe
          return model.fetchCount().then(onFulfill, onReject);
        }
      };
    }
  }, {
    key: "modelClass",
    get: function get() {
      return this.collection.modelClass;
    }
  }, {
    key: "table",
    get: function get() {
      return this.modelClass.table;
    }
  }, {
    key: "secondaryTables",
    get: function get() {
      return this.description.joinTables.concat(this.description.nestedJoinTables.map(function ({
        to: to
      }) {
        return to;
      }));
    }
  }, {
    key: "allTables",
    get: function get() {
      return (0, _rambdax.prepend)(this.table, this.secondaryTables);
    }
  }, {
    key: "associations",
    get: function get() {
      return (0, _helpers.getAssociations)(this.description, this.modelClass, this.collection.db);
    } // `true` if query contains join clauses on foreign tables

  }, {
    key: "hasJoins",
    get: function get() {
      _common.logger.warn('DEPRECATION: Query.hasJoins is deprecated');

      return !!this.secondaryTables.length;
    }
  }]);

  return Query;
}(), _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "_cachedSubscribable", [_lazy.default], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this6 = this;

    return new _subscriptions.SharedSubscribable(function (subscriber) {
      return (0, _subscribeToQuery.default)(_this6, subscriber);
    });
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "_cachedCountSubscribable", [_lazy.default], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this7 = this;

    return new _subscriptions.SharedSubscribable(function (subscriber) {
      return (0, _subscribeToCount.default)(_this7, false, subscriber);
    });
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "_cachedCountThrottledSubscribable", [_lazy.default], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    var _this8 = this;

    return new _subscriptions.SharedSubscribable(function (subscriber) {
      return (0, _subscribeToCount.default)(_this8, true, subscriber);
    });
  }
})), _class);
exports.default = Query;