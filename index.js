"use strict";

var inherits = require("inherits");

var ServiceSet = require("./service-set");

var nodeAdapter = require("./adapters/node");

function NodeServiceSet(config) {
  config.adapter = nodeAdapter;
  ServiceSet.call(this, config);
}

inherits(NodeServiceSet, ServiceSet);

exports.Service = require("./service");
exports.Client = require("./client");
exports.ServiceSet = NodeServiceSet;