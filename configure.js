"use strict";

var inherits = require("inherits");
var Connector = require("./connector");

module.exports = function (config) {
  if (!('adapter' in config)) {
    throw new Error("The pebbles-client must be configured with a HTTP adapter");
  }

  function CustomConnector(options) {
    options.adapter = config.adapter;
    options.clientClasses = config.clientClasses || {};
    Connector.call(this, options);
  }

  inherits(CustomConnector, Connector);

  return {
    Service: require("./service"),
    Client: require("./client"),
    Connector: CustomConnector
  };
};
