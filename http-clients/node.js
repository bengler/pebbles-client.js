var request = require("request");
var extend = require("util-extend");

var util = require("util");

var HttpClient = require("../http-client");

module.exports = NodeClient;

var defaultRequestOpts = {
  agent: false,
  json: true
};

function NodeClient(opts) {
  if (!opts) throw Error("No options given");
  if (!opts.rootUrl) throw Error("No root url given");
  HttpClient.apply(this, arguments);
}

util.inherits(NodeClient, HttpClient);

NodeClient.prototype.request = function perform(method, endpoint, params, opts, callback) {

  var requestOpts = extend({}, {
    method: method,
    url: this.urlTo(endpoint)
  });

  var args = [requestOpts];
  
  if (typeof params === 'function') {
    args.push(params);
  }
  else if (params) {
    requestOpts.qs = params
  }
  if (typeof opts === 'function') {
    args.push(params);
  }
  else if (opts) {
    extend(requestOpts, opts);
  }
  if (callback) args.push(callback)

  console.log(requestOpts)
  return request.apply(request, args)
};

