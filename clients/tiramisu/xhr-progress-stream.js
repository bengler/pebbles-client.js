var Readable = require('stream').Readable;
var inherits = require("inherits");

module.exports = XhrResponseProgressStream;

function XhrResponseProgressStream(xhr) {
  Readable.call(this);
  this.offset = 0;
  this.readable = true;
  xhr.upload.addEventListener("progress", this.reportUploadProgress.bind(this), false);
  xhr.addEventListener('readystatechange', this.handleReadyStateChange.bind(this, xhr), false);
};

inherits(XhrResponseProgressStream, Readable);

XhrResponseProgressStream.prototype.getResponse = function (xhr) {
  return xhr.responseText;
};

XhrResponseProgressStream.prototype._beginRead = function (xhr) {
  // todo: make interval configurable
  this._checkInterval = setInterval(this._checkData.bind(this, xhr), 100)
}

XhrResponseProgressStream.prototype._read = function () {

}
XhrResponseProgressStream.prototype._endRead = function (xhr) {
  this._checkData(xhr);
  this._checkInterval = clearInterval(this._checkInterval);
}
XhrResponseProgressStream.prototype.reportUploadProgress = function (progressEvent) {
  var percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1;
  this.push('{"percent": ' + percent + ',"status": "uploading"}\n');
};

XhrResponseProgressStream.prototype.handleReadyStateChange = function (xhr) {
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

XhrResponseProgressStream.prototype._checkData = function (xhr) {
  var respBody = this.getResponse(xhr);
  if (respBody.length > this.offset) {
    this.push(respBody.slice(this.offset));
    this.offset = respBody.length;
  }
};
