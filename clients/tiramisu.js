"use strict";

var Client = require("../client");
var inherits = require("inherits");
var Readable = require('stream').Readable;
var JSONStream = require('json-stream');
var through = require("through");

module.exports = TiramisuClient

function TiramisuClient() {
  Client.apply(this, arguments);
}

inherits(TiramisuClient, Client);

TiramisuClient.prototype.upload = function (endpoint, fileField, cb) {

  var formData = new FormData();
  formData.append(fileField.name, fileField.files[0]);

  var xhr = new XMLHttpRequest();
  var progress = new ProgressStream(xhr);
  xhr.open("POST", this.urlTo(endpoint));
  xhr.withCredentials = true;
  var error = null;
  progress.on('error', function (e) {
    error = e;
  });
  if (typeof cb == 'function') {
    progress.on('end', function (body) {
      cb(error, body, progress);
    });
  }
  xhr.send(formData);
  return progress.pipe(new JSONStream())
};

var ProgressStream = function (xhr) {
  Readable.call(this);
  this.offset = 0;
  this.readable = true;
  xhr.upload.addEventListener("progress", this.reportProgress.bind(this), false);
  xhr.addEventListener('readystatechange', this.handleReadyStateChange.bind(this, xhr), false);
};

inherits(ProgressStream, Readable);

ProgressStream.prototype.getResponse = function (xhr) {
  return xhr.responseText;
};

ProgressStream.prototype._beginRead = function (xhr) {
  // todo: make interval configurable
  this._checkInterval = setInterval(this._checkData.bind(this, xhr), 100)
}

ProgressStream.prototype._endRead = function (xhr) {
  this._checkData(xhr);
  this._checkInterval = clearInterval(this._checkInterval);
}
ProgressStream.prototype.reportProgress = function (progressEvent) {
  var percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1;
  this.push('{"percent": ' + percent + ',"status": "uploading"}\n');
};

ProgressStream.prototype.handleReadyStateChange = function (xhr) {
  if (xhr.readyState === 1) {
    this.emit('ready');
  }
  else if (xhr.readyState === 3) {
    // Start reading the response
    this._beginRead(xhr);
  }
  else if (xhr.readyState === 4) {
    // finish reading last received chunk of data
    this._endRead(xhr);
    if (xhr.error) {
      this.emit('error', this.getResponse(xhr));
    }
    else {
      this.emit('end');
    }
    this.emit('close');
  }
};

ProgressStream.prototype._checkData = function (xhr) {
  var respBody = this.getResponse(xhr);
  if (respBody.length > this.offset) {
    this.push(respBody.slice(this.offset));
    this.offset = respBody.length;
  }
};
