"use strict";

var slice = [].slice;

module.exports = Client;

var url = require("url");
var path = require("url");

// A connector is a wrapper arount a service and a client, providing an easy way to do various requests to
// service endpoints.
function Client(opts) {
  if (!opts) throw Error("No options given");
  if (!opts.service) throw Error("No service given");
  this.resourceOptions = opts.resourceOptions || {};
  this.service = opts.service;
  this.rootUrl = url.parse(opts.rootUrl || "");
  this.adapter = opts.adapter;
}

Client.prototype.request = function request(method, endpoint, params, opts, cb) {
  if (!method) throw new Error("No HTTP method specified.");
  if (!endpoint) throw new Error("No endpoint specified.");
  return this.adapter.apply(null, [method, this.urlTo(endpoint)].concat(slice.call(arguments, 2)));
};

Client.prototype.urlTo = function urlTo(endpoint) {
  var u = url.parse(this.rootUrl.format());
  u.pathname = this.service.pathTo(endpoint);
  return u.format();
};

Client.prototype.get = function get(endpoint, params, opts, cb) {
  return this.request.apply(this, ['get'].concat(slice.call(arguments)));
};

Client.prototype.post = function post(endpoint, params, opts, cb) {
  return this.request.apply(this, ['post'].concat(slice.call(arguments)));
};

Client.prototype.put = function put(endpoint, params, opts, cb) {
  return this.request.apply(this, ['put'].concat(slice.call(arguments)));
};

Client.prototype.del = function del(endpoint, params, opts, cb) {
  return this.request.apply(this, ['del'].concat(slice.call(arguments)));
};

Client.prototype.resource = function(root, options) {
  options || (options = {});
  var Resource = require("./resource");
  var extend = require("util-extend");
  options = extend({client: this}, extend(this.resourceOptions, options))
  return new Resource(root, options);
};