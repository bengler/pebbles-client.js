var defaultHeaders = {
  Accept: "application/json,text/plain,* / *"
};

var httpStatusCodes = require("../util/http-status");

function normalizeHeaders(headers) {
  return Object.keys(headers).reduce(function(memo, headerKey) {
    memo[headerKey.toLowerCase()] = headers[headerKey];
    return memo;
  }, {});
}

function adaptResponse(data, status, headers, config) {
  return {
    statusCode: status,
    statusText: httpStatusCodes[status],
    responseText: JSON.stringify(data),
    headers: normalizeHeaders(headers()),
    native: config
  };
}

module.exports = function factory($http) {
  return function angularHTTPAdapter(options, callback) {
    var req = $http({
      method: options.method.toUpperCase(),
      url: options.url,
      data: options.body,
      headers: options.headers || defaultHeaders,
      withCredentials: true,
      opts: options.opts,
      params: options.queryString
    });

    if (typeof callback == 'function') {
      req.success(function(data, status, headers, config){
        callback(null, data, adaptResponse(data, status, headers, config)) }
      );
      req.error(function(message, statusCode) {
        callback({statusCode: statusCode}, message, req);
      });
    }

    return req
  }
};