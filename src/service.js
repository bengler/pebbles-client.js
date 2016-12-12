const path = require('path')

// A Service is simply a context free descriptor of a web service
module.exports = class Service {
  constructor(name, version, opts) {
    this.name = name
    this.version = version
  }
  pathTo(endpoint) {
    return path.join('/', 'api', this.name, `v${this.version}`, endpoint)
  }
}
