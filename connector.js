var slice = [].slice;

module.exports = Connector;

// A connector is a wrapper arount a service and a client, providing an easy way to do various requests to
// service endpoints.
function Connector(opts) {
  if (!opts) throw Error("No options given");
  if (!opts.service) throw Error("No service given");
  if (!opts.client) throw Error("No client given");
  this.service = opts.service;
  this.client = opts.client;
}

Connector.prototype.request = function request(method, endpoint, params, opts, cb) {
  if (!method) throw Error("No HTTP method specified.");
  if (!endpoint) throw Error("No endpoint specified.");
  
  endpoint = this.service.pathTo(endpoint);
  
  return this.client.request.apply(this.client, slice.call(arguments));
};

Connector.prototype.get = function get(endpoint, params, opts, cb) {
  return this.request.apply(this, ['get'].concat(slice.call(arguments)));
};

Connector.prototype.post = function post(endpoint, params, opts, cb) {
  return this.request.apply(this, ['post'].concat(slice.call(arguments)));
};

Connector.prototype.put = function put(endpoint, params, opts, cb) {
  return this.request.apply(this, ['put'].concat(slice.call(arguments)));
};

Connector.prototype.del = function del(endpoint, params, opts, cb) {
  return this.request.apply(this, ['del'].concat(slice.call(arguments)));
};

Connector.prototype.resource = function(root, options) {
  options || (options = {})
  var Resource = require("./resource")
  var extend = require("util-extend");
  extend(options, {connector: this});
  return new Resource(root, options)
};