var util = require("util");

var ServiceSet = require("./service-set");

var nodeAdapter = require("./adapters/node");

function NodeServiceSet(config) {
  config.adapter = nodeAdapter;
  ServiceSet.call(this, config);
}

util.inherits(NodeServiceSet, ServiceSet);

exports.Service = require("./service");
exports.Client = require("./client");
exports.ServiceSet = NodeServiceSet;