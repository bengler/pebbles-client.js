const extend = require('xtend')
const Connector = require('./connector')

const adapter = require('./adapters/node-http')

class NodeConnector extends Connector {
  constructor(options) {
    super(extend(options, {adapter: adapter}))
  }
}

module.exports = {
  Service: require('./service'),
  Client: require('./client'),
  Connector: NodeConnector
}
