const http = require('http')
const url = require('url')
const extend = require('xtend')
const stringifyQS = require('../util/stringify-qs')
const duplexify = require('duplexify')
const toHttpError = require('../util/to-http-error')

const defaultRequestHeaders = {
  accept: 'application/json,text/plain,* / *'
}

const DEFAULT_TIMEOUT = 60000

module.exports = configure()
module.exports.configure = configure

function configure(opts) {
  opts = opts || {}

  return {
    promise: promise,
    promisify: promisify,
    stream: stream
  }

  // Wraps a duplex (req, res) stream behind a promise that resolves with the response on success, or rejects with
  // an error on failure.
  // If status code  < 200 or > 299 the promise is rejected with an http error
  // Also, if the content-type of the response is json, the `response.body` will be a parsed json object
  // Additionally an error is thrown if content type says json, but response body doesnt parse
  function promise(options) {

    if (options.body) {
      options.headers = options.headers || {}
      options.headers['content-type'] = options.headers['content-type'] || 'application/json;charset=utf-8'
    }

    const req = stream(options)

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }
    req.end()

    return promisify(req).then(response => {
      // Do additional error handling on response
      if (response.statusCode < 200 || response.statusCode > 299) {
        throw toHttpError(new Error(`HTTP error: ${response.statusCode} ${response.statusText}`), response)
      }
      return response
    })
  }

  // Turns a duplex (req, res) stream into a promise
  function promisify(req) {
    let res
    const chunks = []
    let body = ''
    let onlyStrings = true
    req.on('response', _res => {
      res = _res
    })
    req.on('data', chunk => {
      if (typeof chunk !== 'string') {
        onlyStrings = false
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      body = onlyStrings ? chunks.join('') : Buffer.concat(chunks).toString()
    })

    if (opts.promiseImpl) {
      throw new Error('Support for specifying adapter.promiseImpl has been removed in v2.x.')
    }

    return new Promise((resolve, reject) => {
      req
        .on('error', reject)
        .on('end', () => {
          const contentType = res.headers && res.headers['content-type'] && res.headers['content-type'].split(';')[0]

          let parsed

          if (contentType === 'application/json') {
            try {
              parsed = JSON.parse(body)
            } catch (e) {
              e.message = `${e.message}. Invalid JSON in response from server: ${body}`
              reject(e)
              return
            }
          }

          resolve({
            body: parsed || body,
            text: body,
            statusCode: res.statusCode,
            statusText: http.STATUS_CODES[res.statusCode],
            headers: res.headers,
            _native: res
          })
        })
    })
  }
}

function request(opts) {
  const requestOptions = extend({}, opts)
  delete requestOptions.timeout

  let inProgress = true
  const req = http.request(requestOptions)
  const duplex = duplexify.obj(req)
  duplex.xhr = req.xhr
  if (opts.onRequest) {
    opts.onRequest(duplex.xhr)
  }
  req.on('error', duplex.emit.bind(duplex, 'error'))
  req.on('response', duplex.setReadable.bind(duplex))
  req.on('response', duplex.emit.bind(duplex, 'response'))

  // Timeout handling
  const timeout = (opts ? opts.timeout : null) || DEFAULT_TIMEOUT
  req.on('response', res => {
    inProgress = false
    res.on('end', () => {
      inProgress = false
    })
  })
  if (req.setTimeout) {
    req.setTimeout(timeout)
  }
  req.on('socket', socket => {
    // For Node 0.x. Looks like >= 4 has got this covered with req.setTimeout().
    socket.setTimeout(timeout)
    socket.on('timeout', () => {
      if (inProgress) {
        req.abort()
      }
    })
  })

  return duplex
}

function stream(options) {
  const destUrl = url.parse(options.url, true, true)
  const qs = (options.queryString || destUrl.query) ? stringifyQS(extend(destUrl.query, options.queryString || {})) : ''

  const withCredentials = options.hasOwnProperty('withCredentials')
    ? options.withCredentials
    : (typeof document !== 'undefined' && document.location && document.location.host !== destUrl.host)

  const requestOpts = extend({}, {
    method: options.method.toUpperCase(),
    headers: extend(defaultRequestHeaders, options.headers || {}),
    path: destUrl.pathname + (qs ? `?${qs}` : ''),
    host: destUrl.host,
    port: destUrl.port,
    onRequest: options.onRequest,
    protocol: destUrl.protocol,
    withCredentials: withCredentials
  })

  return request(requestOpts)
}
