var url = require("url");

module.exports = HttpClient;

function HttpClient(opts) {
  opts || (opts = {})
  this.host = opts.host;
  this.beforeFns = [];
  this.afterFns = [];
  this.rootUrl = opts.rootUrl || '';
  this.session = opts.session;
}

HttpClient.prototype.before = function (fn) {
  this.beforeFns.push(fn);
};

HttpClient.prototype.after = function (fn) {
  this.afterFns.push(fn);
};

HttpClient.prototype.urlTo = function urlTo(endpoint) {
  var u = url.parse(this.rootUrl);
  u.path = endpoint;
  return u;
};

HttpClient.prototype.request = function abstractRequest() {
  throw new Error("HttpClient#request is abstract and must be implemented by a subclass")
};