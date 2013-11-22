module.exports = ServiceSet;

var Service = require("./service");
var Connector = require("./connector");

var extend = require("util-extend")

function ServiceSet(opts) {
  this.client = opts.client;
  this.serviceClasses = opts.serviceClasses || {};

  Object.keys(opts.use || {}).forEach(function(serviceName){
    this.use(serviceName, opts.use[serviceName]);
  }, this);
}

ServiceSet.prototype.use = function use(serviceName, opts) {
  if (arguments.length == 1 && !(typeof serviceName === 'string')) {
    for (var key in serviceName) {
      this.use(key, serviceName[key]);
    }
    return this;
  }
  var ServiceClass = this.serviceClasses[serviceName] || Service;
  
  var version = opts.version;
  if (typeof opts !== 'object') {
    version = opts;
  }

  if (typeof version === 'undefined' || +version != version) throw new Error("Invalid version of "+serviceName+": "+version);

  var service = new ServiceClass(serviceName, version, opts);

  var connectorOpts = extend({}, opts);
  
  extend(connectorOpts, {client: this.client, service: service});

  this[serviceName] = new Connector(connectorOpts);

  return this;
};
