"use strict";

var inherits = require("inherits");
var extend = require("util-extend");
var ServiceSet = require("./service-set");
var Client = require("./adapters/jquery");

var defaultServiceClasses = {
  checkpoint: require("./clients/checkpoint")
};

function jQueryServiceSet(config) {
  config.serviceClasses = extend(defaultServiceClasses, config.serviceClasses || {});
  config.client = new Client(config);
  ServiceSet.call(this, config);
}

inherits(jQueryServiceSet, ServiceSet);

exports.ServiceSet = jQueryServiceSet;
exports.Client = Client;
exports.Service = require("./service");
