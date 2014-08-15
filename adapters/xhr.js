"use strict";

var xhr = require("xhr");
var url = require("url");
var merge = require("deepmerge");
var extend = require("util-extend");
var stringifyQS = require("../util/stringify-qs");

var defaultHeaders = {
  Accept: "application/json,text/plain,* / *"
};

function normalizeHeaders(headers) {
  var normalized = {};
  var headerKey;
  for (headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      normalized[headerKey.toLowerCase()] = headers[headerKey];
    }
  }
  return normalized;
}

var httpStatusCodes = require("../util/http-status");
function adaptResponse(body, native) {

  // XDomainRequest in IE9 has no getAllResponseHeaders method... 
  var headers = 'getAllResponseHeaders' in native ? native.getAllResponseHeaders() : {};

  return {
    statusCode: native.statusCode,
    statusText: httpStatusCodes[native.statusCode],
    responseText: JSON.stringify(body),
    headers: normalizeHeaders(headers),
    body: body,
    native: native
  };
}


module.exports = function request(options) {
  var requestOpts = merge({}, {
    method: options.method,
    uri: options.url,
    headers: merge(defaultHeaders, options.headers || {})
  });

  var destUrl = url.parse(requestOpts.uri, true, true);
  if (options.queryString) {
    destUrl.search = stringifyQS(merge(destUrl.query, options.queryString))
    requestOpts.uri = url.format(destUrl);    
  }

  requestOpts.cors = (destUrl.host && destUrl.host !== document.location.host);
  
  if (options.body) {
    requestOpts.json = options.body;
  }

  return new Promise(function(resolve, reject) {
    return xhr(requestOpts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      // Xhr may not parse text response as json by default (it only does so when options.json is set to an object)
      // Therefore we need to parse it in these situations
      if (typeof body == 'string') {
        try { body = JSON.parse(body) } catch (e) {}
      }
      resolve(adaptResponse(body, resp));
    });
  });
};