"use strict";

var inherits = require("inherits");

var Connector = require("./connector");

var nodeAdapter = require("./adapters/node");

function NodeConnector(config) {
  config.adapter = nodeAdapter;
  Connector.call(this, config);
}

inherits(NodeConnector, Connector);

exports.Service = require("./service");
exports.Client = require("./client");
exports.Connector = NodeConnector;