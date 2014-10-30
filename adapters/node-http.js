"use strict";

var http = require("http");
var url = require("url");
var extend = require("xtend");
var stringifyQS = require("../util/stringify-qs");
var duplexify = require("duplexify");
var HttpError = require("../util/http-error");

var defaultRequestHeaders = {
  accept: "application/json,text/plain,* / *"
};

module.exports.promise    = promise;
module.exports.promisify  = promisify;
module.exports.stream     = stream;

// Wraps a duplex (req, res) stream behind a promise that resolves with the response on success, or rejects with
// an error on failure.
// If status code  < 200 or > 299 the promise is rejected with an http error
// Also, if the content-type of the response is json, the `response.body` will be a parsed json object
// Additionally an error is thrown if content type says json, but response body doesnt parse
function promise(options) {

  if (options.body) {
    options.headers = options.headers || {};
    options.headers['content-type'] = options.headers['content-type'] || "application/json;charset=utf-8";
  }

  var req = stream(options);

  if (options.body) {
    req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
  }
  req.end();

  return promisify(req).then(function(response) {
    // Do additional error handling on response
    if (response.statusCode < 200 || response.statusCode > 299) {
      throw new HttpError("Http error: "+response.statusCode+" "+response.statusText, response);
    }
    return response;
  });
}

// Turns a duplex (req, res) stream into a promise
function promisify(req) {
  var response;
  var body = '';
  req.on('response', function(res) {
    response = res;
  });
  req.on('data', function(chunk) {
    body += chunk;
  });
  return new Promise(function(resolve, reject) {
    req
      .on('error', reject)
      .on('end', function() {
        resolve(adaptResponse(body, response));
      });
  });
}

// Adapts a native response to a common structure
// Includes parsing of response body into json depending on the value of the content-type header
function adaptResponse(rawBody, native) {

  var contentType = native.headers && native.headers['content-type'] && native.headers['content-type'].split(";")[0];

  return {
    body: (contentType === 'application/json') ? JSON.parse(rawBody) : rawBody,
    text: rawBody,
    statusCode: native.statusCode,
    statusText: http.STATUS_CODES[native.statusCode],
    headers: native.headers,
    _native: native
  };
}

function request(opts) {
  var req = http.request(opts);
  var duplex = duplexify.obj(req);
  duplex.xhr = req.xhr;
  req.on('error', duplex.emit.bind(duplex, 'error'));
  req.on('response', duplex.setReadable.bind(duplex));
  req.on('response', duplex.emit.bind(duplex, 'response'));
  return duplex;
}

function stream(options) {
  var destUrl = url.parse(options.url, true, true);
  var qs = (options.queryString || destUrl.query) ? stringifyQS(extend(destUrl.query, options.queryString || {})) : '';

  var withCredentials = options.hasOwnProperty('withCredentials') ? options.withCredentials :
    (typeof document !== 'undefined' && document.location && document.location.host !== destUrl.host);

  var requestOpts = extend({}, {
    method: options.method.toUpperCase(),
    headers: extend(defaultRequestHeaders, options.headers || {}),
    path: destUrl.pathname + (qs ? '?'+qs : ''),
    host: destUrl.host,
    port: destUrl.port,
    withCredentials: withCredentials
  });

  return request(requestOpts);
}