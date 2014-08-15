"use strict";

var inherits = require("inherits");
var Connector = require("./connector");

var adapter = require("./adapters/node");
function NodeConnector(options) {
  options.adapter = adapter;
  Connector.call(this, options);
}

inherits(NodeConnector, Connector);

module.exports = {
  Service: require("./service"),
  Client: require("./client"),
  Connector: NodeConnector
};