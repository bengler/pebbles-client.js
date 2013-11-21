module.exports = ServiceSet;

var Service = require("./service");
var Connector = require("./connector");

function ServiceSet(opts) {
  this.client = opts.client;
  this.serviceClasses = opts.serviceClasses || {};

  Object.keys(opts.use || {}).forEach(function(serviceName){
    this.use(serviceName, opts.use[serviceName]);
  }, this);
}

ServiceSet.prototype.use = function use(serviceName, version, opts) {
  if (arguments.length == 1 && !(typeof serviceName === 'string')) {
    for (var key in serviceName) {
      this.use(key, serviceName[key]);
    }
    return this;
  }
  var ServiceClass = this.serviceClasses[serviceName] || Service; 
  var service = new ServiceClass(serviceName, version, opts);
  this[serviceName] = new Connector({client: this.client, service: service});
  return this;
};
