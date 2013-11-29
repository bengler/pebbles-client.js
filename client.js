"use strict";

var slice = [].slice;

module.exports = Client;

var url = require("url");
var extend = require("util-extend");

function isObject(val) {
  return typeof val === 'object' && val !== null;
}
function isString(val) {
  return typeof val === 'string'
}

function normalizeArgs(args, method, secondArg) {
  var options = { method: method };
  if (isObject(args[0])) {
    // (options, [cb])
    options = args[0];
  } else {
    // (endpoint, [queryParams|body], [opts], [cb])
    options.endpoint = args[0];
    if (isObject(args[1])) {
      options[secondArg] = args[1];
    }
    if (isObject(args[2])) {
      extend(options, args[2]);
    }
  }
  var cb = args[args.length - 1];
  return typeof cb === 'function' ? [options, cb] : [options];
}
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

Client.prototype.request = function request(options, callback) {
  if (typeof options === 'string') {
    options = { endpoint: options }
  }
  if (!('endpoint' in options)) throw new Error("No endpoint given. Cannot continue.");
  var opts = extend({}, options);
  opts.url = this.urlTo(options.endpoint);
  delete opts.endpoint; // Not needed anymore

  // Forward to adapter
  return this.adapter.apply(this.adapter, [opts].concat(slice.call(arguments, 1)));
};

Client.prototype.urlTo = function urlTo(endpoint) {
  var u = url.parse(this.rootUrl.format());
  u.pathname = this.service.pathTo(endpoint);
  return u.format();
};

Client.prototype.get = function get(endpoint, queryString, opts, cb) {
  return this.request.apply(this, normalizeArgs(arguments, 'get', 'queryString'));
};

Client.prototype.del = function del(endpoint, queryString, opts, cb) {
  return this.request.apply(this, normalizeArgs(arguments, 'delete', 'queryString'));
};

Client.prototype.post = function post(endpoint, body, opts, cb) {
  return this.request.apply(this, normalizeArgs(arguments, 'post', 'body'));
};

Client.prototype.put = function put(endpoint, body, opts, cb) {
  return this.request.apply(this, normalizeArgs(arguments, 'put', 'body'));
};

Client.prototype.resource = function(root, options) {
  options || (options = {});
  var Resource = require("./resource");
  options = extend({client: this}, extend(this.resourceOptions, options))
  return new Resource(root, options);
};