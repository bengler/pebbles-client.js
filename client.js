"use strict";

module.exports = Client;

var extend = require("util-extend");

var slice = [].slice;

function merge() {
  return slice.call(arguments).reduce(function(xtended, arg) {
    return extend(xtended, arg);
  }, {});
}

function StreamWrapper(client) {
  this.client = client;
}

StreamWrapper.prototype.request = function(opts) {
  return this.client({stream: true}, opts);
};

['get', 'del', 'post', 'put'].forEach(function(method) {
  StreamWrapper.prototype[method] = function(_, __, opts) {
    return this.client[method](_, __, merge({stream: true}, opts));
  };
});

// A Client is a wrapper around a connector and a service, providing an easy way to do various requests to
// service endpoints.
function Client(opts) {
  if (!opts) throw Error("No options given");
  if (!opts.service) throw Error("No service given");
  this.service = opts.service;
  this.connector = opts.connector;
}

Client.prototype.urlTo = function urlTo(endpoint, queryString) {
  return this.connector.urlTo(this.service.pathTo(endpoint), queryString);
};

Client.prototype.request = function request(options) {
  if (typeof options === 'string') {
    options = { endpoint: options }
  }
  if (!('endpoint' in options)) throw new Error("No endpoint given. Cannot continue.");
  var opts = extend({}, options);
  opts.url = this.urlTo(options.endpoint);
  delete opts.endpoint; // Not needed anymore
  // Delegate the actual request to the connector
  return this.connector.request(opts);
};

Client.prototype.stream = function stream() {
  return new StreamWrapper(this);
};

Client.prototype.get = function get(endpoint, queryString, opts) {
  return this.request(merge({}, opts, {
    method: 'get',
    endpoint: endpoint,
    queryString: queryString
  }));
};

Client.prototype.del = function del(endpoint, queryString, opts) {
  return this.request(merge({}, opts, {
    method: 'delete',
    endpoint: endpoint,
    queryString: queryString
  }));
};

Client.prototype.post = function post(endpoint, body, opts) {
  return this.request(merge({}, opts, {
    method: 'post',
    body: body,
    endpoint: endpoint
  }));
};

Client.prototype.put = function put(endpoint, body, opts) {
  return this.request(merge({}, opts, {
    endpoint: endpoint,
    method: 'put',
    body: body
  }));
};