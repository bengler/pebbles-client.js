"use strict";

// This is the main entry point for require('pebbles-client') in a browser environment.
// It uses the lightweight xhr adapter instead of the request node module.

var inherits = require("inherits");
var Connector = require("./connector");

var adapter = require("./adapters/xhr");
function BrowserConnector(options) {
  options.adapter = adapter;
  Connector.call(this, options);
}

inherits(BrowserConnector, Connector);

module.exports = {
  Service: require("./service"),
  Client: require("./client"),
  Connector: BrowserConnector
};