module.exports = ServiceSet;

var Service = require("./service");
var Client = require("./client");

var extend = require("util-extend")

function ServiceSet(opts) {
  this.rootUrl = opts.rootUrl;
  this.adapter = opts.adapter;
  this.clientClasses = opts.clientClasses || {};

  Object.keys(opts.use || {}).forEach(function(serviceName){
    this.use(serviceName, opts.use[serviceName]);
  }, this);
}

ServiceSet.prototype.use = function use(serviceName, opts) {
  if (arguments.length == 1 && !(typeof serviceName === 'string')) {
    // Assume object
    for (var key in serviceName) {
      this.use(key, serviceName[key]);
    }
    return this;
  }
  
  var version = opts.version;
  if (typeof opts !== 'object') {
    version = opts;
  }

  if (typeof version === 'undefined' || +version != version) throw new Error("Invalid version of "+serviceName+": "+version);

  var service = new Service(serviceName, version, opts);

  var ClientClass = this.clientClasses[serviceName] || Client;

  var clientOpts = extend({
    adapter: this.adapter,
    rootUrl: this.rootUrl,
    service: service
  }, opts);

  this[serviceName] = new ClientClass(clientOpts);

  return this;
};
