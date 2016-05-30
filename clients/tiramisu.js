"use strict";

var Client = require("../client");
var inherits = require("inherits");
var ProgressStream = require("./tiramisu/xhr-progress-stream")
var split = require('split')
var utils = require('./tiramisu/utils')

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
  console.log('uploading!')
  xhr.send(formData);
  return progress
    .pipe(split('\n'))
    .pipe(utils.filter(function (line) {
      return line && line.trim().length > 0;
    }))
    .pipe(utils.parseJSON());
};
