"use strict";

var Client = require("../../client");
var inherits = require("inherits");
var JSONStream = require('json-stream');
var through = require('through');

module.exports = TiramisuClient;

var normalizers = {
  uploading: function(p)    { return p * 0.6      },
  received: function(p)     { return 60           },
  transferring: function(p) { return 60 + p * 0.4 },
  completed: function(p)    { return 100          }
};

function normalizeProgress(event) {
  this.queue(Object.assign({}, event, {
    percent: normalizers[event.status](event.percent)
  }))
}

function TiramisuClient() {
  Client.apply(this, arguments);
}

inherits(TiramisuClient, Client);

TiramisuClient.prototype.upload = function (endpoint, file) {

  var formData = new window.FormData();
  formData.append('file', file);

  var req = this.stream().post(endpoint);

  req.xhr.upload.addEventListener("progress", function (progressEvent) {
    var percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1;
    req.push('{"percent": ' + percent + ',"status": "uploading"}\n');
  });

  req.end(formData);

  return req.pipe(new JSONStream()).pipe(through(normalizeProgress));
};
