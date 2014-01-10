module.exports = function factory($http) {
  return function angularHTTPAdapter(options, callback) {
    var req = $http({
      method: options.method.toUpperCase(),
      url: options.url,
      data: options.body,
      withCredentials: true,
      opts: options.opts,
      params: options.queryString
    });

    if (typeof callback == 'function') {
      req.success(function(res){ callback(null, res, req) });
      req.error(function(res) { callback(res, res, req) });
    }

    return req
  }
};