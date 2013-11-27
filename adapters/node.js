"use strict";

var _request = require("request");
var extend = require("util-extend");

var defaultRequestOpts = {
  agent: false,
  json: true
};

module.exports = function request(method, url, params, opts, callback) {

  var requestOpts = extend(extend({}, defaultRequestOpts), {
    method: method,
    url: url
  });

  var args = [requestOpts];
  
  if (typeof params === 'function') {
    args.push(params);
  }
  else if (params) {
    requestOpts.qs = params;
  }
  if (callback) args.push(callback);

  console.log(args);
  return _request.apply(request, args);
};