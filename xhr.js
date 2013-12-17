"use strict";

var inherits = require("inherits");
var extend = require("util-extend");
var Connector = require("./connector");
var Client = require("./adapters/xhr");

var adapter = require("./adapters/xhr");

function XhrConnector(config) {
  config || (config = {});
  config.adapter = adapter;
  Connector.call(this, config);
}

inherits(XhrConnector, Connector);

exports.Connector = XhrConnector;
exports.Client = Client;
exports.Service = require("./service");
