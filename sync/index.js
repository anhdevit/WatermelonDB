"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.synchronize = synchronize;
exports.hasUnsyncedChanges = hasUnsyncedChanges;

var _common = require("../utils/common");

var _impl = require("./impl");

var _helpers = require("./impl/helpers");

// See Sync docs for usage details
function synchronize({
  database: database,
  pullChanges: pullChanges,
  pushChanges: pushChanges,
  sendCreatedAsUpdated = false,
  migrationsEnabledAtVersion: migrationsEnabledAtVersion,
  log: log,
  _unsafeBatchPerCollection: _unsafeBatchPerCollection
}) {
  return new Promise(function ($return, $error) {
    var resetCount, lastPulledAt, schemaVersion, migration, shouldSaveSchemaVersion, remoteChanges, newLastPulledAt, localChanges;
    (0, _helpers.ensureActionsEnabled)(database);
    resetCount = database._resetCount;
    log && (log.startedAt = new Date()); // TODO: Wrap the three computionally intensive phases in `requestIdleCallback`
    // pull phase

    return Promise.resolve((0, _impl.getLastPulledAt)(database)).then(function ($await_3) {
      try {
        lastPulledAt = $await_3;
        log && (log.lastPulledAt = lastPulledAt);
        return Promise.resolve((0, _impl.getMigrationInfo)(database, log, lastPulledAt, migrationsEnabledAtVersion)).then(function ($await_4) {
          try {
            ({
              schemaVersion: schemaVersion,
              migration: migration,
              shouldSaveSchemaVersion: shouldSaveSchemaVersion
            } = $await_4);
            return Promise.resolve(pullChanges({
              lastPulledAt: lastPulledAt,
              schemaVersion: schemaVersion,
              migration: migration
            })).then(function ($await_5) {
              try {
                ({
                  changes: remoteChanges,
                  timestamp: newLastPulledAt
                } = $await_5);
                log && (log.newLastPulledAt = newLastPulledAt);
                (0, _common.invariant)('number' === typeof newLastPulledAt && 0 < newLastPulledAt, "pullChanges() returned invalid timestamp ".concat(newLastPulledAt, ". timestamp must be a non-zero number"));
                return Promise.resolve(database.action(function (action) {
                  return new Promise(function ($return, $error) {
                    (0, _helpers.ensureSameDatabase)(database, resetCount);
                    return Promise.resolve((0, _impl.getLastPulledAt)(database)).then(function ($await_6) {
                      try {
                        (0, _common.invariant)(lastPulledAt === $await_6, '[Sync] Concurrent synchronization is not allowed. More than one synchronize() call was running at the same time, and the later one was aborted before committing results to local database.');
                        return Promise.resolve(action.subAction(function () {
                          return (0, _impl.applyRemoteChanges)(database, remoteChanges, sendCreatedAsUpdated, log, _unsafeBatchPerCollection);
                        })).then(function () {
                          try {
                            return Promise.resolve((0, _impl.setLastPulledAt)(database, newLastPulledAt)).then(function () {
                              try {
                                if (shouldSaveSchemaVersion) {
                                  return Promise.resolve((0, _impl.setLastPulledSchemaVersion)(database, schemaVersion)).then(function () {
                                    try {
                                      return function () {
                                        return $return();
                                      }.call(this);
                                    } catch ($boundEx) {
                                      return $error($boundEx);
                                    }
                                  }.bind(this), $error);
                                }

                                return function () {
                                  return $return();
                                }.call(this);
                              } catch ($boundEx) {
                                return $error($boundEx);
                              }
                            }.bind(this), $error);
                          } catch ($boundEx) {
                            return $error($boundEx);
                          }
                        }.bind(this), $error);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  });
                }, 'sync-synchronize-apply')).then(function () {
                  try {
                    return Promise.resolve((0, _impl.fetchLocalChanges)(database)).then(function ($await_11) {
                      try {
                        localChanges = $await_11;
                        (0, _helpers.ensureSameDatabase)(database, resetCount);

                        if (!(0, _helpers.isChangeSetEmpty)(localChanges.changes)) {
                          return Promise.resolve(pushChanges({
                            changes: localChanges.changes,
                            lastPulledAt: newLastPulledAt
                          })).then(function () {
                            try {
                              (0, _helpers.ensureSameDatabase)(database, resetCount);
                              return Promise.resolve((0, _impl.markLocalChangesAsSynced)(database, localChanges)).then(function () {
                                try {
                                  return function () {
                                    log && (log.finishedAt = new Date());
                                    return $return();
                                  }.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            } catch ($boundEx) {
                              return $error($boundEx);
                            }
                          }.bind(this), $error);
                        }

                        return function () {
                          log && (log.finishedAt = new Date());
                          return $return();
                        }.call(this);
                      } catch ($boundEx) {
                        return $error($boundEx);
                      }
                    }.bind(this), $error);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }.bind(this), $error);
  });
}

function hasUnsyncedChanges({
  database: database
}) {
  return new Promise(function ($return) {
    return $return((0, _impl.hasUnsyncedChanges)(database));
  });
}