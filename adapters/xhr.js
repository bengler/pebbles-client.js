"use strict";

var xhr = require("xhr")
var url = require("url")
var extend = require("util-extend");

var defaultOpts = {
  cors: true,
  headers: { Accept: "application/json,text/plain,* / *" }
};

function adaptCallback(callback) {
  return function(err, resp, body) {
    return callback(err, JSON.parse(body), resp);
  }
}

module.exports = function request(options, callback) {
  var requestOpts = extend({}, defaultOpts);
  requestOpts.method = options.method;
  requestOpts.uri = options.url;
  if (options.queryString) {
    var u = url.parse(requestOpts.uri, true, true)
    u.query = extend(u.query, options.queryString)
    requestOpts.uri = url.format(u);
  }

  if (options.body) {
    requestOpts.json = options.body;
  }

  callback || (callback = function() {})
  return xhr(requestOpts, adaptCallback(callback));
};