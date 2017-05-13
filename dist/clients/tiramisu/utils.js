'use strict';

var extend = require('xtend');
var through = require('through2');

// A few util functions

module.exports = {
  filter: filter,
  parseJSON: parseJSON,
  checkError: checkError,
  normalizeProgress: normalizeProgress,
  waitForVersion: waitForVersion,
  findIndex: findIndex
};

function findIndex(array, predicateFn) {
  var foundIndex = -1;
  array.some(function (item, index) {
    var found = predicateFn(item, index, array);
    if (found) {
      foundIndex = index;
    }
    return found;
  });
  return foundIndex;
}

function filter(test) {
  return through(function (chunk, enc, cb) {
    if (test(String(chunk))) {
      this.push(chunk);
    }
    cb();
  });
}

function parseJSON() {
  return through.obj(function (jsonStr, enc, cb) {
    var parsed = void 0;
    var error = null;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      error = e;
    }
    if (error) {
      cb(error);
      return;
    }
    this.push(parsed);
    cb();
  });
}

function checkError() {
  return through.obj(function write(data, chunk, cb) {
    if (data.status === 'failed') {
      cb(new Error('Upload failed: ' + data.message));
      return;
    }
    this.push(data);
    cb();
  });
}

var normalizers = {
  initializing: function initializing(percent) {
    return 0;
  },
  uploading: function uploading(percent) {
    return percent * 0.6;
  },
  received: function received(percent) {
    return 60;
  },
  transferring: function transferring(percent) {
    return 60 + percent * 0.2;
  },
  transferred: function transferred(percent) {
    return 80;
  },
  ready: function ready(percent) {
    return 80 + percent * 0.2;
  },
  completed: function completed() {
    return 100;
  },
  failed: function failed() {
    return 100;
  }
};

function normalizeProgress() {
  return through.obj(function write(event, enc, cb) {
    this.push(extend(event, {
      percent: normalizers[event.status](event.percent)
    }));
    cb();
  });
}

function waitForVersion(version, _opts) {
  var opts = _opts || {};
  opts.timeout = opts.timeout || 1000 * 60 * 5;
  opts.pollInterval = opts.pollInterval || 1000;

  function poll() {
    return _checkS3(version.url).then(function () {
      return version;
    }).catch(function () {
      return delay(opts.pollInterval).then(poll);
    });
  }
  return timeout(poll(), opts.timeout, 'Transcoding timed out after ' + opts.timeout + 'ms');
}

function _checkS3(url) {
  var req = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    req.open('HEAD', url, true);
    req.onload = function () {
      if (req.status == 403) {
        reject();
      } else {
        resolve();
      }
    };
    req.onerror = reject;
    req.send();
  });
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function timeout(promise, time, error) {
  return Promise.race([promise, delay(time).then(function () {
    throw new Error(error || 'Operation timed out');
  })]);
}