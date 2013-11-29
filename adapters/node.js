"use strict";

var _request = require("request");
var extend = require("util-extend");

var defaultOpts = {
  agent: false,
  json: true
};

function swapBodyAndReq(callback) {
  return function(err, resp, body) {
    return callback(err, body, resp);
  }
}

module.exports = function request(options, callback) {

  var requestOpts = extend({}, defaultOpts);

  requestOpts.method = options.method;
  requestOpts.url = options.url;
  var args = typeof callback == 'function' ? [requestOpts, swapBodyAndReq(callback)] : [requestOpts];
  return _request.apply(_request, args);
};