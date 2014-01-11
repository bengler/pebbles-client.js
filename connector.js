"use strict";

module.exports = Connector;

var Service = require("./service");
var Client = require("./client");

var extend = require("util-extend");
var url = require("url");
var slice = [].slice;

function defaultFactory(clientOpts) {
  return new Client(clientOpts);
}

function Connector(options) {
  options || (options = {});
  this.baseUrl = options.baseUrl || '';
  this.defaults = options.defaults || {};
  this.adapter = options.adapter;
  this.clientFactories = options.clientFactories || {};

  Object.keys(options.use || {}).forEach(function(serviceName){
    this.use(serviceName, options.use[serviceName]);
  }, this);
}

Connector.prototype.request = function request(options, callback) {
  // Forward to adapter
  if (typeof this.adapter !== 'function') throw new Error("Missing adapter for connector");
  return this.adapter.apply(this.adapter, arguments);
};

Connector.prototype.urlTo = function(path, queryString) {
  var u = url.parse(this.baseUrl, !!queryString);
  if (queryString) {
    u.query = u.query ? extend(u.query, queryString) : queryString;
  }
  u.pathname = path;
  return url.format(u);
};

Connector.prototype.use = function use(mixed, opts) {
  if (arguments.length === 1 && (mixed instanceof Client)) {
    this[mixed.service.name] = mixed;
    return this;
  }
  if (arguments.length === 1 && (mixed instanceof Service)) {
    return this.use(mixed.name, mixed.version)
  }
  if (arguments.length === 1 && (typeof mixed !== 'string')) {
    // Assume object
    for (var key in mixed) {
      if (mixed.hasOwnProperty(key)) {
        this.use(key, mixed[key]);
      }
    }
    return this;
  }
  
  var version = opts.version;
  if (typeof opts !== 'object') {
    version = opts;
  }

  if (typeof version === 'undefined' || +version !== version) throw new Error("Invalid version of "+mixed+": "+version);

  var service = new Service(mixed, version, opts);

  var factory = this.clientFactories[mixed] || defaultFactory;

  var clientOpts = extend({
    connector: this,
    baseUrl: this.baseUrl,
    service: service
  }, opts);

  this.use(factory(clientOpts));

  return this;
};
