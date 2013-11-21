var $ = require("jquery")
var util = require("util");
var Client = require("../client");

function methodOverride(method, url, params) {
  params || (params = {})
  var headers = params.headers || {};
  if (method !== 'GET' && method !== 'POST') {
    headers["X-Http-Method-Override"] = method;
    params || (params = {});
    params['_method'] = method;
    method = 'POST';
  }
  return [method, url, params, headers];
}

function jQueryClient() {
  Client.apply(this, arguments)
}

util.inherits(jQueryClient, Client);

jQueryClient.prototype.request = function (method, url, params) {
  this.beforeFns.concat(methodOverride).forEach(function(fn) {
    fn.call(this, method, url, params)
  }, this);
  return $.ajax(url, params);
};

module.exports = jQueryClient;