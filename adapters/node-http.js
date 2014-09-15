"use strict";

var http = require("http");
var url = require("url");
var merge = require("deepmerge");
var extend = require("util-extend");
var stringifyQS = require("../util/stringify-qs");
var through = require("through");

var defaultRequestHeaders = {
  Accept: "application/json,text/plain,* / *",
  'Content-Type': "application/json"
};

var httpStatusTexts = require("../util/http-status");
function adaptResponse(native) {
  return {
    statusCode: native.statusCode,
    statusText: httpStatusTexts[native.statusCode],
    headers: native.headers,
    _native: native
  };
}

module.exports.stream = stream;
module.exports.toPromise = toPromise;

function stream(options) {
  var destUrl = url.parse(options.url, true, true);
  var qs = (options.queryString || destUrl.query) ? stringifyQS(merge(destUrl.query, options.queryString || {})) : '';
  var requestOpts = merge({}, {
    method: options.method.toUpperCase(),
    headers: merge(defaultRequestHeaders, options.headers || {}),
    path: destUrl.path + (qs ? '?'+qs : ''),
    host: destUrl.host,
    port: destUrl.port
  });

  var res = through();
  var req = http.request(requestOpts, function(response) {
    res.emit('response', adaptResponse(response));
    response.pipe(res);
  });
  
  if (options.body) {
    req.write(JSON.stringify(options.body));
  }
  req.end();
  
  return res;
}

function toPromise(req) {
  var response, body = '';
  req.on('response', function(res) {
    response = res;
  });

  req.on('data', function(chunk) {
    body += chunk;
  });

  return new Promise(function(resolve, reject) {
    req.on('end', function() {
      try {
        body = JSON.parse(body);
      } catch(e) {}
      resolve(merge(response, {body: body}))
    });
    req.on('error', reject);
  });
}