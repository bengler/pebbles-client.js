'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Service = require('./service');
var Client = require('./client');
var stringifyQS = require('./util/stringify-qs');

var extend = require('xtend');
var deepExtend = require('deep-extend');
var url = require('url');

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

var Connector = function () {
  function Connector() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Connector);

    // Forward to adapter
    if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || !options.adapter) {
      throw new Error('A request adapter must be provided when Connector is instantiated');
    }
    this.requestOptions = options.requestOptions || {};
    this.adapter = options.adapter;
    this.baseUrl = options.baseUrl || '';
    this.clientClasses = options.clientClasses || {};
    if (options.services) {
      this.use(options.services);
    }
  }

  _createClass(Connector, [{
    key: 'request',
    value: function request(options) {
      return options.stream ? this._stream(options) : this._promise(options);
    }
  }, {
    key: '_stream',
    value: function _stream(options) {
      return this.adapter.stream(deepExtend({}, this.requestOptions, options));
    }
  }, {
    key: '_promise',
    value: function _promise(options) {
      var _this = this;

      return Promise.resolve().then(function () {
        return _this.adapter.promise(deepExtend({}, _this.requestOptions, options));
      });
    }
  }, {
    key: 'urlTo',
    value: function urlTo(path, queryString) {

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
    }
  }, {
    key: 'use',
    value: function use(mixed, opts) {
      var _this2 = this;

      if (arguments.length === 1 && mixed instanceof Client) {
        this[mixed.service.name] = mixed;
        return this;
      }
      if (arguments.length === 1 && mixed instanceof Service) {
        return this.use(mixed.name, mixed.version);
      }
      if (arguments.length === 1 && typeof mixed !== 'string') {
        // Assume object
        Object.keys(mixed).forEach(function (key) {
          _this2.use(key, mixed[key]);
        });
        return this;
      }

      var version = opts.version;
      if ((typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
        version = opts;
      }

      if (typeof version === 'undefined' || +version !== version) {
        throw new Error('Invalid version of ' + mixed + ': ' + version);
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
    }
  }]);

  return Connector;
}();

module.exports = Connector;