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
    statusText: httpStatusCodes[native.statusCode] || '<Unknown status code>',
    responseText: JSON.stringify(body),
    body: body,
    headers: extend({}, native.headers),
    native: native
  };
}

module.exports = function request(options) {

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

  return new Promise(function(resolve, reject) {
    _request(requestOpts, function(err, resp, body) {
      return err ? reject(err) : resolve(adaptResponse(body, native));
    });
  });
};
