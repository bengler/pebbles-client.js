const assert = require('assert')
const mock = require('mock')
const through = require('through2')
// Can't use immutable to add properties to a stream object
const extend = require('xtend/mutable')
const http = require('http')

describe('Node HTTP Adapter', () => {
  it('requests', () => {
    const nativeResponse = extend(through(), {
      headers: {},
      statusCode: 200,
      statusText: 'OK'
    })

    const adapter = mock('../../src/adapters/node-http', {
      http: extend(http, {
        request(options) {
          const mockReq = through()
          process.nextTick(() => {
            mockReq.emit('response', nativeResponse)
            process.nextTick(() => { // eslint-disable-line max-nested-callbacks
              nativeResponse.push('foo')
              nativeResponse.push('bar')
              nativeResponse.end()
            })
          })
          return mockReq
        }
      })
    })

    return adapter.promise({method: 'get', url: 'http://pebblestack.org/foo'}).then(response => {
      assert.equal(response.body, 'foobar')
      assert.equal(response.statusCode, 200)
      assert.equal(response.statusText, 'OK')
      assert.equal(response._native, nativeResponse)
    })
  })
})
