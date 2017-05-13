'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var extend = require('xtend');
var deepExtend = require('deep-extend');

// A Client is a wrapper around a connector and a service, providing an easy way to do various requests to
// service endpoints.

var Client = function () {
  function Client() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Client);

    if (!options) {
      throw Error('No options given');
    }
    if (!options.service) {
      throw Error('No service given');
    }
    this.requestOptions = options.requestOptions || {};
    this.service = options.service;
    this.connector = options.connector;
  }

  _createClass(Client, [{
    key: 'urlTo',
    value: function urlTo(endpoint, queryString) {
      return this.connector.urlTo(this.service.pathTo(endpoint), deepExtend({}, this.requestOptions.queryString || {}, queryString || {}));
    }
  }, {
    key: '_prepareOptions',
    value: function _prepareOptions(options) {
      if (typeof options === 'string') {
        options = { endpoint: options };
      }

      if (!('endpoint' in options)) {
        throw new Error('No endpoint given. Cannot continue.');
      }
      return deepExtend({}, this.requestOptions, extend(options, {
        url: this.urlTo(options.endpoint)
      }));
    }
  }, {
    key: 'request',
    value: function request(options) {
      // Delegate the actual request to the connector
      return options.stream ? this._stream(options) : this._promise(options);
    }
  }, {
    key: 'stream',
    value: function stream() {
      return new StreamWrapper(this);
    }
  }, {
    key: '_stream',
    value: function _stream(options) {
      return this.connector.request(this._prepareOptions(options));
    }
  }, {
    key: '_promise',
    value: function _promise(options) {
      var _this = this;

      return Promise.resolve().then(function () {
        return _this.connector.request(_this._prepareOptions(options));
      });
    }
  }, {
    key: 'get',
    value: function get(endpoint, queryString, options) {
      return this.request(extend(options, {
        method: 'get',
        endpoint: endpoint,
        queryString: queryString || {}
      }));
    }
  }, {
    key: 'del',
    value: function del(endpoint, queryString, options) {
      return this.request(extend(options, {
        method: 'delete',
        endpoint: endpoint,
        queryString: queryString || {}
      }));
    }
  }, {
    key: 'post',
    value: function post(endpoint, body, options) {
      return this.request(extend(options, {
        method: 'post',
        body: body,
        endpoint: endpoint
      }));
    }
  }, {
    key: 'put',
    value: function put(endpoint, body, options) {
      return this.request(extend(options, {
        endpoint: endpoint,
        method: 'put',
        body: body
      }));
    }
  }]);

  return Client;
}();

function StreamWrapper(client) {
  this.client = client;
}

['request', 'get', 'del', 'post', 'put'].forEach(function (method) {
  StreamWrapper.prototype[method] = function (_, __, options) {
    return this.client[method](_, __, extend({ stream: true }, options));
  };
});

module.exports = Client;