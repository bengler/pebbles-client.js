'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Client = require('../../client');
var through = require('through2');
var extend = require('xtend');
var split = require('split2');
var pumpify = require('pumpify');

var _require = require('./utils'),
    normalizeProgress = _require.normalizeProgress,
    parseJSON = _require.parseJSON,
    checkError = _require.checkError,
    waitForVersion = _require.waitForVersion,
    filter = _require.filter,
    findIndex = _require.findIndex;

var TiramisuClient = function (_Client) {
  _inherits(TiramisuClient, _Client);

  function TiramisuClient() {
    _classCallCheck(this, TiramisuClient);

    return _possibleConstructorReturn(this, (TiramisuClient.__proto__ || Object.getPrototypeOf(TiramisuClient)).apply(this, arguments));
  }

  _createClass(TiramisuClient, [{
    key: 'uploadImage',
    value: function uploadImage(endpoint, file, options) {
      var uploadOpts = {};
      if (options && options.forceJPEG === false) {
        uploadOpts.queryString = { force_jpeg: false }; // eslint-disable-line camelcase
      }
      return pumpify.obj(this.upload(endpoint, file, uploadOpts), this.waitFor(options.waitFor), normalizeProgress());
    }
  }, {
    key: 'uploadFile',
    value: function uploadFile(endpoint, file, options) {
      return pumpify.obj(this.upload(endpoint, file, options), normalizeProgress());
    }
  }, {
    key: 'upload',
    value: function upload(endpoint, file, options) {

      var formData = new window.FormData();
      formData.append('file', file);

      var req = this.stream().post(endpoint, null, options);

      req.xhr.upload.addEventListener('progress', function (progressEvent) {
        var percent = progressEvent.lengthComputable ? Math.ceil(progressEvent.loaded / progressEvent.total * 100) : -1;
        req.push('{"percent": ' + percent + ',"status": "uploading"}\n');
      });

      req.end(formData);

      return pumpify.obj(req, split('\n'), filter(function (line) {
        return line && line.trim().length > 0;
      }), parseJSON(), checkError());
    }
  }, {
    key: 'waitFor',
    value: function waitFor(versionMatchFn) {
      var completedEvent = void 0;
      var pendingVersions = void 0;
      var waitForCount = void 0;

      var stream = through.obj(write, end);

      function write(event, enc, cb) {
        if (event.status === 'completed' || event.status === 'failed') {
          completedEvent = event;
        }
        this.push(event);
        cb();
      }

      function end(cb) {
        var _this2 = this;

        // Rename the 'completed' event to 'transferred' as it is not completed just yet :)
        this.push(extend(completedEvent, { status: 'transferred' }));

        pendingVersions = completedEvent.metadata.versions.slice();
        if (versionMatchFn) {
          var matchingVersionIndex = findIndex(pendingVersions, versionMatchFn);
          if (matchingVersionIndex > -1) {
            pendingVersions = pendingVersions.slice(0, matchingVersionIndex + 1);
          }
        }
        waitForCount = pendingVersions.length;

        pollNext().then(function (readyVersion) {
          _this2.push({ status: 'completed', ready: readyVersion, metadata: completedEvent.metadata, percent: 100 });
          cb();
        });
      }

      function pollNext() {
        return waitForVersion(pendingVersions.shift()).then(function (readyVersion) {
          var percent = 100 / waitForCount * (waitForCount - pendingVersions.length);

          stream.push({ status: 'ready', version: readyVersion, metadata: completedEvent.metadata, percent: percent });

          if (pendingVersions.length == 0) {
            return readyVersion;
          }
          return pollNext();
        });
      }

      return stream;
    }
  }]);

  return TiramisuClient;
}(Client);

TiramisuClient.normalizeProgress = normalizeProgress;

module.exports = TiramisuClient;