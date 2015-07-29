"use strict";

var path = require("path");

module.exports = Service;

// A Service is simply a context free descriptor of a web service
function Service(name, version, opts) {
  this.name = name;
  this.version = version;
}

Service.prototype.pathTo = function pathTo(endpoint) {
  return path.join("/", "api", this.name, 'v' + this.version, endpoint);
};
