"use strict";

var util = require("util");
var extend = require("util-extend");
var ServiceSet = require("./service-set");
var Client = require("./adapters/xhr");

var defaultClientClasses = {
  checkpoint: require("./clients/checkpoint")
};

var adapter = require("./adapters/xhr");

function XhrServiceSet(config) {
  config || (config = {});
  config.clientClasses = extend(defaultClientClasses, config.clientClasses || {});
  config.adapter = adapter;
  ServiceSet.call(this, config);
}

util.inherits(XhrServiceSet, ServiceSet);

exports.ServiceSet = XhrServiceSet;
exports.Client = Client;
exports.Service = require("./service");
