var util = require("util");

var ServiceSet = require("./service-set");

var Client = require("./http-clients/node");

function NodeServiceSet(config) {
  config.client = new Client(config);
  ServiceSet.call(this, config);
}

util.inherits(NodeServiceSet, ServiceSet);

exports.Service = require("./service");
exports.Client = Client;
exports.ServiceSet = NodeServiceSet;