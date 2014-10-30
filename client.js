"use strict";

module.exports = Client;

var extend = require("xtend");
var deepExtend = require("deep-extend");

// A Client is a wrapper around a connector and a service, providing an easy way to do various requests to
// service endpoints.
function Client(options) {
  if (!options) throw Error("No options given");
  if (!options.service) throw Error("No service given");
  this.requestOptions = options.requestOptions || {};
  this.service = options.service;
  this.connector = options.connector;
}

Client.prototype.urlTo = function urlTo(endpoint, queryString) {
  return this.connector.urlTo(this.service.pathTo(endpoint), deepExtend({}, this.requestOptions.queryString || {}, queryString || {}));
};

Client.prototype.request = function request(options) {
  if (typeof options === 'string') {
    options = { endpoint: options }
  }

  if (!('endpoint' in options)) throw new Error("No endpoint given. Cannot continue.");

  // Delegate the actual request to the connector
  return this.connector.request(deepExtend({}, this.requestOptions, extend(options, {
    url: this.urlTo(options.endpoint)
  })));
};

Client.prototype.stream = function stream() {
  return new StreamWrapper(this);
};

Client.prototype.get = function get(endpoint, queryString, options) {
  return this.request(extend(options, {
    method: 'get',
    endpoint: endpoint,
    queryString: queryString || {}
  }));
};

Client.prototype.del = function del(endpoint, queryString, options) {
  return this.request(extend(options, {
    method: 'delete',
    endpoint: endpoint,
    queryString: queryString || {}
  }));
};

Client.prototype.post = function post(endpoint, body, options) {
  return this.request(extend(options, {
    method: 'post',
    body: body,
    endpoint: endpoint
  }));
};

Client.prototype.put = function put(endpoint, body, options) {
  return this.request(extend(options, {
    endpoint: endpoint,
    method: 'put',
    body: body
  }));
};

function StreamWrapper(client) {
  this.client = client;
}

['request', 'get', 'del', 'post', 'put'].forEach(function(method) {
  StreamWrapper.prototype[method] = function(_, __, options) {
    return this.client[method](_, __, extend({stream: true}, options));
  };
});