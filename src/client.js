const extend = require('xtend')
const deepExtend = require('deep-extend')

// A Client is a wrapper around a connector and a service, providing an easy way to do various requests to
// service endpoints.
class Client {
  constructor(options = {}) {
    if (!options) {
      throw Error('No options given')
    }
    if (!options.service) {
      throw Error('No service given')
    }
    this.requestOptions = options.requestOptions || {}
    this.service = options.service
    this.connector = options.connector
  }


  urlTo(endpoint, queryString) {
    return this.connector.urlTo(this.service.pathTo(endpoint), deepExtend({}, this.requestOptions.queryString || {}, queryString || {}))
  }

  _prepareOptions(options) {
    if (typeof options === 'string') {
      options = {endpoint: options}
    }

    if (!('endpoint' in options)) {
      throw new Error('No endpoint given. Cannot continue.')
    }
    return deepExtend({}, this.requestOptions, extend(options, {
      url: this.urlTo(options.endpoint)
    }))
  }

  request(options) {
    // Delegate the actual request to the connector
    return options.stream ? this._stream(options) : this._promise(options)
  }

  stream() {
    return new StreamWrapper(this)
  }

  _stream(options) {
    return this.connector.request(this._prepareOptions(options))
  }

  _promise(options) {
    return Promise.resolve().then(() => {
      return this.connector.request(this._prepareOptions(options))
    })
  }

  get(endpoint, queryString, options) {
    return this.request(extend(options, {
      method: 'get',
      endpoint: endpoint,
      queryString: queryString || {}
    }))
  }

  del(endpoint, queryString, options) {
    return this.request(extend(options, {
      method: 'delete',
      endpoint: endpoint,
      queryString: queryString || {}
    }))
  }

  post(endpoint, body, options) {
    return this.request(extend(options, {
      method: 'post',
      body: body,
      endpoint: endpoint
    }))
  }

  put(endpoint, body, options) {
    return this.request(extend(options, {
      endpoint: endpoint,
      method: 'put',
      body: body
    }))
  }
}

function StreamWrapper(client) {
  this.client = client
}

['request', 'get', 'del', 'post', 'put'].forEach(method => {
  StreamWrapper.prototype[method] = function (_, __, options) {
    return this.client[method](_, __, extend({stream: true}, options))
  }
})

module.exports = Client
