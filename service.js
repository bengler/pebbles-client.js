"use strict";

var path = require("path");

module.exports = Service;

// A Service is simply a description of a web service without context (i.e. hostname, etc)
function Service(name, version, opts) {
  opts || (opts = {});
  this.resourceSettings = opts.resourceSettings;
  this.name = name;
  this.version = version;
  this.resources = [];
}

Service.prototype.pathTo = function pathTo(endpoint) {
  return path.join("/", "api", this.name, 'v'+this.version, endpoint);
};
