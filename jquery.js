"use strict";

var inherits = require("inherits");
var extend = require("util-extend");
var Connector = require("./connector");
var Client = require("./adapters/jquery");

var defaultServiceClasses = {
  checkpoint: require("./clients/checkpoint")
};

function jQueryConnector(config) {
  config.serviceClasses = extend(defaultServiceClasses, config.serviceClasses || {});
  config.client = new Client(config);
  Connector.call(this, config);
}

inherits(jQueryConnector, Connector);

exports.Connector = jQueryConnector;
exports.Client = Client;
exports.Service = require("./service");
