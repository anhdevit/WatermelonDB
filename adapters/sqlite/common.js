"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncReturnToResult = syncReturnToResult;

function syncReturnToResult(syncReturn) {
  if ('success' === syncReturn.status) {
    return {
      value: syncReturn.result
    };
  } else if ('error' === syncReturn.status) {
    var error = new Error(syncReturn.message); // $FlowFixMem

    error.code = syncReturn.code;
    return {
      error: error
    };
  }

  return {
    error: new Error('Unknown native bridge response')
  };
}