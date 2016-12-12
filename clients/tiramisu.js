"use strict";

var Client = require('../client');
var inherits = require('inherits');
var through = require('through2');
var split = require('split2');
var pumpify = require('pumpify');

function filter(test) {
  return through(function (chunk, enc, cb) {
    if (test(String(chunk))) {
      this.push(chunk);
    }
    cb()
  });
}

function parseJSON() {
  return through.obj(function (jsonStr, enc, cb) {
    var parsed;
    var error = null;
    try {
      parsed = JSON.parse(jsonStr);
    } catch(e) {
      error = e
    }
    if (error) {
      cb(error)
      return
    }
    this.push(parsed)
    cb()
  });
}

module.exports = TiramisuClient;

var normalizers = {
  initializing: function (p) { return 0; },
  uploading: function (p) { return p * 0.6; },
  received: function (p) { return 60; },
  transferring: function (p) { return 60 + p * 0.2; },
  transferred: function (p) { return 80; },
  ready: function (p) { return 80 + p * 0.2; },
  completed: function (p) { return 100; },
  failed: function (p) { return 100; }
};

function normalizeProgress() {
  return through.obj(function write(event, enc, cb) {
    this.push(Object.assign({}, event, {
      percent: normalizers[event.status](event.percent)
    }))
    cb();
  });
}
TiramisuClient.normalizeProgress = normalizeProgress
function checkError() {
  return through.obj(function write(data, chunk, cb) {
    if (data.status === 'failed') {
      cb(new Error('Upload failed: ' + data.message))
      return
    }
    this.push(data)
    cb();
  });
}

function TiramisuClient() {
  Client.apply(this, arguments);
}

inherits(TiramisuClient, Client);

TiramisuClient.prototype.uploadImage = function (endpoint, file, options) {
  var uploadOpts = {};
  if (options && options.forceJPEG === false) {
    uploadOpts.queryString = {force_jpeg: false};
  }
  return pumpify.obj(
    this.upload(endpoint, file, uploadOpts),
    this.waitFor(options.waitFor),
    normalizeProgress()
  );
};

TiramisuClient.prototype.uploadFile = function (endpoint, file, options) {
  return pumpify.obj(
    this.upload(endpoint, file, options),
    normalizeProgress()
  );
};

TiramisuClient.prototype.upload = function (endpoint, file, options) {

  var formData = new window.FormData();
  formData.append('file', file);

  var req = this.stream().post(endpoint, null, options);

  req.xhr.upload.addEventListener('progress', function (progressEvent) {
    var percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1;
    req.push('{"percent": ' + percent + ',"status": "uploading"}\n');
  });

  req.end(formData);

  return pumpify.obj(
    req,
    split('\n'),
    filter(function (line) {
      return line && line.trim().length > 0;
    }),
    parseJSON(),
    checkError()
  );
};

TiramisuClient.prototype.waitFor = function waitFor(versionMatchFn) {
  var completedEvent;
  var pendingVersions;
  var waitForCount;

  var stream = through.obj(write, end);

  function write(event, enc, cb) {
    if (event.status === 'completed' || event.status === 'failed') {
      completedEvent = event;
    }
    this.push(event)
    cb();
  }

  function end(cb) {
    // Rename the 'completed' event to 'transferred' as it is not completed just yet :)
    this.push(Object.assign({}, completedEvent, {status: 'transferred'}));

    pendingVersions = completedEvent.metadata.versions.slice();
    if (versionMatchFn) {
      var matchingVersionIndex = pendingVersions.findIndex(versionMatchFn);
      if (matchingVersionIndex > -1) {
        pendingVersions = pendingVersions.slice(0, matchingVersionIndex + 1);
      }
    }
    waitForCount = pendingVersions.length;

    pollNext().then(function (readyVersion) {
      this.push({status: 'completed', ready: readyVersion, metadata: completedEvent.metadata, percent: 100});
      cb()
    }.bind(this));
  }

  function pollNext() {
    return waitForVersion(pendingVersions.shift())
      .then(function (readyVersion) {
        var percent = 100 / waitForCount * (waitForCount - pendingVersions.length);

        stream.push({status: 'ready', version: readyVersion, metadata: completedEvent.metadata, percent: percent});

        if (pendingVersions.length == 0) {
          return readyVersion;
        }
        return pollNext();
      });
  }

  return stream;
};

function waitForVersion(version, _opts) {
  var opts = _opts || {};
  opts.timeout = opts.timeout || 1000 * 60 * 5;
  opts.pollInterval = opts.pollInterval || 1000;

  function poll() {
    return _checkS3(version.url)
      .then(function () {
        return version;
      })
      .catch(function retry() {
        return delay(opts.pollInterval).then(poll);
      });
  }

  return timeout(poll(), opts.timeout, 'Transcoding timed out after ' + opts.timeout + 'ms');
}

// A few util functions
function _checkS3(url) {
  var req = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    req.open('HEAD', url, true);
    req.onload = function () {
      if (req.status == 403) {
        reject();
      }
      else {
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
