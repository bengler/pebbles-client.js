var util = require("util");
var extend = require("util-extend");
var ServiceSet = require("./service-set")
var Client = require("./http-clients/jquery");

var defaultServiceClasses = {
  checkpoint: require("./pebbles/checkpoint")
};

function jQueryServiceSet(config) {
  config.serviceClasses = extend(defaultServiceClasses, config.serviceClasses || {})
  config.client = new Client(config);
  ServiceSet.call(this, config);
}

util.inherits(jQueryServiceSet, ServiceSet);

exports.ServiceSet = jQueryServiceSet;
exports.Client = Client;
exports.Service = require("./service");
