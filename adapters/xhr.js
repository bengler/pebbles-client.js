"use strict";

var xhr = require("xhr");
var url = require("url");
var merge = require("deepmerge");
var extend = require("util-extend");

var defaultOpts = {
  cors: true
};
var defaultHeaders = {
  Accept: "application/json,text/plain,* / *"
};

function normalizeHeaders(headers) {
  var normalized = {};
  var headerKey;
  for (headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      normalized[headerKey.toLowerCase()] = headers[headerKey];
    }
  }
  return normalized;
}

var httpStatusCodes = require("../util/http-status");
function adaptResponse(body, native) {
  return {
    statusCode: native.statusCode,
    statusText: httpStatusCodes[native.statusCode],
    responseText: JSON.stringify(body),
    headers: normalizeHeaders(native.getAllResponseHeaders()),
    native: native
  };
}

function adaptCallback(callback) {
  return function(err, resp, body) {
    // Xhr may not parse text response as json by default (it only does so when options.json is set to an object)
    // Therefore we need to parse it in these situations
    if (typeof body == 'string') {
      try { body = JSON.parse(body) } catch (e) {}
    }
    return callback(err, body, adaptResponse(body, resp));
  }
}

module.exports = function request(options, callback) {
  var requestOpts = merge(defaultOpts, {
    method: options.method,
    uri: options.url,
    headers: merge(defaultHeaders, options.headers || {})
  });
  if (options.queryString) {
    var u = url.parse(requestOpts.uri, true, true)
    u.query = merge(u.query, options.queryString)
    requestOpts.uri = url.format(u);
  }
  if (options.body) {
    requestOpts.json = options.body;
  }
  callback || (callback = function noop() {})
  return xhr(requestOpts, adaptCallback(callback));
};