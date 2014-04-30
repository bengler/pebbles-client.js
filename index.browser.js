// This is the main entry point for require('pebbles-client') in a browser environment.
// It uses the lightweight xhr adapter instead of the request node module.

"use strict";

var inherits = require("inherits");

var Connector = require("./connector");

var xhrAdapter = require("./adapters/xhr");

function XhrConnector(config) {
  config.adapter = xhrAdapter;
  Connector.call(this, config);
}

inherits(XhrConnector, Connector);

exports.Service = require("./service");
exports.Client = require("./client");
exports.Connector = XhrConnector;