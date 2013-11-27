var xhr = require("xhr")

module.exports = function request(method, url, params, opts, callback) {
  return xhr({
    cors: true,
    method: method,
    uri: url,
    json: params
  }, callback);
};