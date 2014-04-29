"use strict";

var _request = require("request");
var extend = require("util-extend");
var url = require("url");
var merge = require("deepmerge");
var stringifyQS = require("../util/stringify-qs");

var defaultOpts = {
  agent: false,
  json: true
};

var httpStatusCodes = require("../util/http-status");
function adaptResponse(body, native) {
  return {
    statusCode: native.statusCode,
    statusText: httpStatusCodes[native.statusCode],
    responseText: JSON.stringify(body),
    body: body,
    headers: extend({}, native.headers),
    native: native
  };
}

function adaptCallback(callback) {
  return function(err, resp, body) {
    if (err) {
      return callback(err, resp)
    }
    return callback(err, body, adaptResponse(body, resp));
  }
}

module.exports = function request(options, callback) {

  var requestOpts = extend({}, defaultOpts);
  requestOpts.url = options.url;

  requestOpts.method = options.method;
  if (requestOpts.method.toLowerCase() === 'get' && options.queryString) {
    requestOpts.url = url.parse(options.url, true, true);
    requestOpts.url.search = '?'+stringifyQS(merge(requestOpts.url.query, options.queryString));
    requestOpts.url = url.format(requestOpts.url)
  }
  else {
    requestOpts.qs = options.queryString;
  }
  requestOpts.body = options.body;

  var args = typeof callback == 'function' ? [requestOpts, adaptCallback(callback)] : [requestOpts];
  _request.apply(_request, args);
};