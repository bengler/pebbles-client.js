const Service = require('./service')
const Client = require('./client')
const stringifyQS = require('./util/stringify-qs')

const extend = require('xtend')
const deepExtend = require('deep-extend')
const url = require('url')

/**
 * # Connector
 *
 * A connector represents a set of service clients running on a given baseUrl.
 * It must be instantiated with an HTTP request adapter in order to perform the actual requests.
 *
 * ## Usage:
 *
 * ```js
 * new Connector({
 *   baseUrl: 'http://pebblestack.org',
 *   adapter: nodeAdapter
 * });
 *
 * ```
 */

class Connector {
  constructor(options = {}) {
    // Forward to adapter
    if (typeof options !== 'object' || !options.adapter) {
      throw new Error('A request adapter must be provided when Connector is instantiated')
    }
    this.requestOptions = options.requestOptions || {}
    this.adapter = options.adapter
    this.baseUrl = options.baseUrl || ''
    this.clientClasses = options.clientClasses || {}
    if (options.services) {
      this.use(options.services)
    }
  }

  request(options) {
    return options.stream ? this._stream(options) : this._promise(options)
  }

  _stream(options) {
    return this.adapter.stream(deepExtend({}, this.requestOptions, options))
  }

  _promise(options) {
    return Promise.resolve().then(() => {
      return this.adapter.promise(deepExtend({}, this.requestOptions, options))
    })
  }

  urlTo(path, queryString) {

    const baseUrl = url.parse(this.baseUrl, true, true)
    const parsedPath = url.parse(path, true, true)

    const query = extend(this.requestOptions.queryString || {}, baseUrl.query || {}, parsedPath.query, queryString || {})

    return url.format({
      pathname: parsedPath.pathname,
      host: baseUrl.host,
      search: stringifyQS(query),
      port: baseUrl.port,
      protocol: baseUrl.protocol
    })
  }

  use(mixed, opts) {
    if (arguments.length === 1 && (mixed instanceof Client)) {
      this[mixed.service.name] = mixed
      return this
    }
    if (arguments.length === 1 && (mixed instanceof Service)) {
      return this.use(mixed.name, mixed.version)
    }
    if (arguments.length === 1 && (typeof mixed !== 'string')) {
      // Assume object
      Object.keys(mixed).forEach(key => {
        this.use(key, mixed[key])
      })
      return this
    }

    let version = opts.version
    if (typeof opts !== 'object') {
      version = opts
    }

    if (typeof version === 'undefined' || +version !== version) {
      throw new Error(`Invalid version of ${mixed}: ${version}`)
    }

    const service = new Service(mixed, version, opts)

    const ClientClass = this.clientClasses[mixed] || Client

    const clientOpts = extend({
      connector: this,
      baseUrl: this.baseUrl,
      service: service
    }, opts)

    this.use(new ClientClass(clientOpts))

    return this
  }
}

module.exports = Connector
