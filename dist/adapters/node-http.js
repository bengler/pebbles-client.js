'use strict';

var http = require('http');
var url = require('url');
var extend = require('xtend');
var stringifyQS = require('../util/stringify-qs');
var duplexify = require('duplexify');
var toHttpError = require('../util/to-http-error');

var defaultRequestHeaders = {
  accept: 'application/json,text/plain,* / *'
};

var DEFAULT_TIMEOUT = 60000;

module.exports = configure();
module.exports.configure = configure;

function configure(opts) {
  opts = opts || {};

  return {
    promise: promise,
    promisify: promisify,
    stream: stream
  };

  // Wraps a duplex (req, res) stream behind a promise that resolves with the response on success, or rejects with
  // an error on failure.
  // If status code  < 200 or > 299 the promise is rejected with an http error
  // Also, if the content-type of the response is json, the `response.body` will be a parsed json object
  // Additionally an error is thrown if content type says json, but response body doesnt parse
  function promise(options) {

    if (options.body) {
      options.headers = options.headers || {};
      options.headers['content-type'] = options.headers['content-type'] || 'application/json;charset=utf-8';
    }

    var req = stream(options);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();

    return promisify(req).then(function (response) {
      // Do additional error handling on response
      if (response.statusCode < 200 || response.statusCode > 299) {
        throw toHttpError(new Error('HTTP error: ' + response.statusCode + ' ' + response.statusText), response);
      }
      return response;
    });
  }

  // Turns a duplex (req, res) stream into a promise
  function promisify(req) {
    var res = void 0;
    var chunks = [];
    var body = '';
    var onlyStrings = true;
    req.on('response', function (_res) {
      res = _res;
    });
    req.on('data', function (chunk) {
      if (typeof chunk !== 'string') {
        onlyStrings = false;
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      body = onlyStrings ? chunks.join('') : Buffer.concat(chunks).toString();
    });

    if (opts.promiseImpl) {
      throw new Error('Support for specifying adapter.promiseImpl has been removed in v2.x.');
    }

    return new Promise(function (resolve, reject) {
      req.on('error', reject).on('end', function () {
        var contentType = res.headers && res.headers['content-type'] && res.headers['content-type'].split(';')[0];

        var parsed = void 0;

        if (contentType === 'application/json') {
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            e.message = e.message + '. Invalid JSON in response from server: ' + body;
            reject(e);
            return;
          }
        }

        resolve({
          body: parsed || body,
          text: body,
          statusCode: res.statusCode,
          statusText: http.STATUS_CODES[res.statusCode],
          headers: res.headers,
          _native: res
        });
      });
    });
  }
}

function request(opts) {
  var requestOptions = extend({}, opts);
  delete requestOptions.timeout;

  var inProgress = true;
  var req = http.request(requestOptions);
  var duplex = duplexify.obj(req);
  duplex.xhr = req.xhr;
  if (opts.onRequest) {
    opts.onRequest(duplex.xhr);
  }
  req.on('error', duplex.emit.bind(duplex, 'error'));
  req.on('response', duplex.setReadable.bind(duplex));
  req.on('response', duplex.emit.bind(duplex, 'response'));

  // Timeout handling
  var timeout = (opts ? opts.timeout : null) || DEFAULT_TIMEOUT;
  req.on('response', function (res) {
    inProgress = false;
    res.on('end', function () {
      inProgress = false;
    });
  });
  if (req.setTimeout) {
    req.setTimeout(timeout);
  }
  req.on('socket', function (socket) {
    // For Node 0.x. Looks like >= 4 has got this covered with req.setTimeout().
    socket.setTimeout(timeout);
    socket.on('timeout', function () {
      if (inProgress) {
        req.abort();
      }
    });
  });

  return duplex;
}

function stream(options) {
  var destUrl = url.parse(options.url, true, true);
  var qs = options.queryString || destUrl.query ? stringifyQS(extend(destUrl.query, options.queryString || {})) : '';

  var withCredentials = options.hasOwnProperty('withCredentials') ? options.withCredentials : typeof document !== 'undefined' && document.location && document.location.host !== destUrl.host;

  var requestOpts = extend({}, {
    method: options.method.toUpperCase(),
    headers: extend(defaultRequestHeaders, options.headers || {}),
    path: destUrl.pathname + (qs ? '?' + qs : ''),
    host: destUrl.host,
    port: destUrl.port,
    onRequest: options.onRequest,
    protocol: destUrl.protocol,
    withCredentials: withCredentials
  });

  return request(requestOpts);
}