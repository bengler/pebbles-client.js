"use strict";

var Client = require('../../client');
var inherits = require('inherits');
var JSONStream = require('json-stream');
var through = require('through');

module.exports = TiramisuClient;

var normalizers = {
  initializing: function (p) { return 0; },
  uploading: function (p) { return p * 0.6; },
  received: function (p) { return 60; },
  transferring: function (p) { return 60 + p * 0.2; },
  transferred: function (p) { return 80; },
  ready: function (p) { return 80 + p * 0.2; },
  completed: function (p) { return 100; }
};

function TiramisuClient(options) {
  options.service = 'tiramisu';
  Client.call(this, options);
}

inherits(TiramisuClient, Client);

TiramisuClient.prototype.uploadImage = function (endpoint, file, options) {
  return this.uploadFile(endpoint, file)
    .pipe(this.waitFor(options.waitFor))
    .pipe(this._normalizeProgress());
};

TiramisuClient.prototype.uploadFile = function (endpoint, file) {
  return this.upload(endpoint, file)
    .pipe(this._normalizeProgress());
};

TiramisuClient.prototype.upload = function (endpoint, file) {

  var formData = new window.FormData();
  formData.append('file', file);

  var req = this.stream().post(endpoint);

  req.xhr.upload.addEventListener('progress', function (progressEvent) {
    var percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1;
    req.push('{"percent": ' + percent + ',"status": "uploading"}\n');
  });

  req.end(formData);

  return req.pipe(new JSONStream());
};

TiramisuClient.prototype._normalizeProgress = function _normalizeProgress() {
  return through(function write(event) {
    this.queue(Object.assign({}, event, {
      percent: normalizers[event.status](event.percent)
    }));
  });
};

TiramisuClient.prototype.waitFor = function waitFor(versionMatchFn) {
  var completedEvent;
  var pendingVersions;
  var waitForCount;

  var stream = through(write, end);

  function write(event) {
    if (event.status == 'completed') {
      completedEvent = event;
      return;
    }
    stream.queue(event);
  }

  function end() {
    // Rename the 'completed' event to 'transferred' as it is not completed just yet :)
    stream.queue(Object.assign({}, completedEvent, {status: 'transferred'}));

    pendingVersions = completedEvent.metadata.versions;
    if (versionMatchFn) {
      var matchingVersionIndex = pendingVersions.findIndex(versionMatchFn);
      if (matchingVersionIndex > -1) {
        pendingVersions = pendingVersions.slice(0, matchingVersionIndex + 1);
      }
    }
    waitForCount = pendingVersions.length;

    pollNext().then(function (readyVersion) {
      stream.queue({status: 'completed', ready: readyVersion, metadata: completedEvent.metadata, percent: 100});
      stream.queue(null);
    });
  }

  function pollNext() {
    return waitForVersion(pendingVersions.shift())
      .then(function (readyVersion) {
        var percent = 100 / waitForCount * (waitForCount - pendingVersions.length);

        stream.queue({status: 'ready', version: readyVersion, metadata: completedEvent.metadata, percent: percent});

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
