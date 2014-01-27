"use strict";

var _request = require("request");
var extend = require("util-extend");

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
    return callback(err, body, adaptResponse(body, resp));
  }
}

module.exports = function request(options, callback) {

  var requestOpts = extend({}, defaultOpts);

  requestOpts.method = options.method;
  requestOpts.url = options.url;
  requestOpts.qs = options.queryString;
  requestOpts.body = options.body;

  var args = typeof callback == 'function' ? [requestOpts, adaptCallback(callback)] : [requestOpts];
  _request.apply(_request, args);
};