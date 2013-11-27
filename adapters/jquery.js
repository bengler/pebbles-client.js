"use strict";

var $ = require("jquery");
var Client = require("../http-client");

function methodOverride(method, url, params) {
  params || (params = {});
  var headers = params.headers || {};
  if (method !== 'GET' && method !== 'POST') {
    headers["X-Http-Method-Override"] = method;
    params || (params = {});
    params['_method'] = method;
    method = 'POST';
  }
  return [method, url, params, headers];
}

module.exports = function request(method, url, params) {
  return $.ajax(url, params);
};