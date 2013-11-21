var path = require("path");

module.exports = Service;

// A Service is simply a description of a web service without context (i.e. hostname, etc)
function Service(name, version, opts) {
  this.opts = opts || {};
  this.name = name;
  this.version = version;
}

Service.prototype.pathTo = function pathTo(endpoint) {
  return path.join("/", "api", this.name, 'v'+this.version, endpoint)
};
