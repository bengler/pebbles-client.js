var Readable = require('stream').Readable;
var inherits = require("inherits");

module.exports = IframeResponseProgressStream;

function IframeResponseProgressStream(iframe, origin) {
  Readable.call(this);
  this.readable = true;
  this.emit('readable');
  this._beginFakeUploadProgress();
  this._gotMessage = false;
  this.iframe = iframe;
  this.origin = origin;

  this.filterMessage = function (messageEvent) {
    if (messageEvent.origin != this.origin) return;
    var progress;
    try {
      progress = JSON.parse(messageEvent.data)
    }
    catch (e) {
      return
    }
    this.handleEvent(progress)
  }.bind(this);

  iframe.addEventListener("readystatechange", this.handleReadyStateChange.bind(this))
  window.addEventListener('message', this.filterMessage);
}

inherits(IframeResponseProgressStream, Readable);

IframeResponseProgressStream.prototype._read = function () {
  
}
IframeResponseProgressStream.prototype.handleReadyStateChange = function (ev) {
  var readyState = this.iframe.readyState;
  if (readyState === 'interactive') {
    this._endFakeUploadProgress();
  }
  else if (readyState === 'complete') {
    if (!this._gotMessage) {
      this.emit('error', new Error('Unable to communicate with server'));
      this.emit('close');
    }
  }
};


IframeResponseProgressStream.prototype.handleEvent = function(progressEvent) {
  this._gotMessage = true;
  this.push(JSON.stringify(progressEvent)+"\n")
  if (progressEvent.status == 'failed' || progressEvent.status == 'completed') {
    window.removeEventListener('message', this.filterMessage);
    this.emit("end");
    this.emit('close')
  }
}
IframeResponseProgressStream.prototype._beginFakeUploadProgress = function () {
  this._fakedUploadProgress = 0;
  this._fakeReportInterval = setInterval(this._reportFakeUploadProgress.bind(this), 100)
}

IframeResponseProgressStream.prototype._endFakeUploadProgress = function () {
  this._fakeReportInterval = clearInterval(this._fakeReportInterval);
}

IframeResponseProgressStream.prototype._reportFakeUploadProgress = function () {
  this._fakedUploadProgress += ((100 - this._fakedUploadProgress) / 100);
  this.push('{"percent": ' + this._fakedUploadProgress + ',"status": "uploading"}\n');
}
