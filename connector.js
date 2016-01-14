"use strict";

module.exports = Connector;

var Service = require("./service");
var Client = require("./client");
var stringifyQS = require("./util/stringify-qs");

var extend = require("xtend");
var deepExtend = require("lodash.merge");
var url = require("url");

/**
 * # Connector
 *
 * A connector represents a set of service clients running on a given baseUrl.
 * It must be instantiated with an HTTP request adapter in order to perform the actual requests.
 *
 * ## Usage:
 *
 * ```js
 * new Connector({
 *   baseUrl: 'http://pebblestack.org',
 *   adapter: nodeAdapter
 * });
 *
 * ```
 */

function Connector(options) {
  // Forward to adapter
  if (typeof options !== 'object' || !options.adapter) {
    throw new Error("A request adapter must be provided when Connector is instantiated");
  }
  this.requestOptions = options.requestOptions || {};
  this.adapter = options.adapter;
  this.baseUrl = options.baseUrl || '';
  this.clientClasses = options.clientClasses;
  if (options.services) {
    this.use(options.services);
  }
}

Connector.prototype.request = function request(options) {
  return options.stream ? this._stream(options) : this._promise(options)
};

Connector.prototype._stream = function _stream(options) {
  return this.adapter.stream(deepExtend({}, this.requestOptions, options))
};

Connector.prototype._promise = function _promise(options) {
  return Promise.resolve().then(function () {
    return this.adapter.promise(deepExtend({}, this.requestOptions, options));
  }.bind(this))
};

Connector.prototype.urlTo = function (path, queryString) {

  var baseUrl = url.parse(this.baseUrl, true, true);
  var parsedPath = url.parse(path, true, true);

  var query = extend(this.requestOptions.queryString || {}, baseUrl.query || {}, parsedPath.query, queryString || {});

  return url.format({
    pathname: parsedPath.pathname,
    host: baseUrl.host,
    search: stringifyQS(query),
    port: baseUrl.port,
    protocol: baseUrl.protocol
  });
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

  if (typeof version === 'undefined' || +version !== version) {
    throw new Error("Invalid version of " + mixed + ": " + version);
  }

  var service = new Service(mixed, version, opts);

  var ClientClass = this.clientClasses[mixed] || Client;

  var clientOpts = extend({
    connector: this,
    baseUrl: this.baseUrl,
    service: service
  }, opts);

  this.use(new ClientClass(clientOpts));

  return this;
};
