"use strict";

var xhr = require("xhr")
var url = require("url")
var merge = require("deepmerge");

var defaultOpts = {
  cors: true,
  headers: { Accept: "application/json,text/plain,* / *" }
};

function adaptCallback(callback) {
  return function(err, resp, body) {
    // Xhr may not parse text response as json by default (it only does so when options.json is set to an object)
    // Therefore we need to parse it in these situations
    if (typeof body == 'string') {
      try { body = JSON.parse(body) } catch (e) {}
    }
    return callback(err, body, resp);
  }
}

module.exports = function request(options, callback) {
  var requestOpts = merge(defaultOpts, {
    method: options.method,
    uri: options.url
  });
  if (options.queryString) {
    var u = url.parse(requestOpts.uri, true, true)
    u.query = merge(u.query, options.queryString)
    requestOpts.uri = url.format(u);
  }
  if (options.body) {
    requestOpts.json = options.body;
  }

  callback || (callback = function() {})
  return xhr(requestOpts, adaptCallback(callback));
};