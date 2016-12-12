const extend = require('xtend')
const Connector = require('./connector')

module.exports = function (config = {}) {
  if (!('adapter' in config)) {
    throw new Error('The pebbles-client must be configured with a HTTP adapter')
  }

  class CustomConnector extends Connector {
    constructor(options = {}) {
      super(extend(options, {
        adapter: config.adapter,
        clientClasses: config.clientClasses || {}
      }))
    }
  }

  return {
    Service: require('./service'),
    Client: require('./client'),
    Connector: CustomConnector
  }
}
