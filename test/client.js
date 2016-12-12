

const assert = require('assert')
const sinon = require('sinon')

const Client = require('../src/client')
const Service = require('../src/service')
const Connector = require('../src/connector')

describe('Client', () => {
  it('Forwards a request to an endpoint to a fully qualified service path', () => {
    const spy = sinon.spy()
    const mockAdapter = {
      promise: spy
    }

    const connector = new Connector({adapter: mockAdapter})
    const client = new Client({service: new Service('kudu', 1), connector: connector})
    return client.get('/foo').then(() => {
      assert(spy.calledOnce)
      assert(spy.firstCall.args, ['get', '/api/kudu/v1/foo'])
    })
  })

  it('Passes through request params', () => {
    const spy = sinon.spy()
    const mockAdapter = {
      promise: spy
    }
    const connector = new Connector({adapter: mockAdapter})
    const client = new Client({service: new Service('kudu', 1), connector: connector})

    return client.get('/foo', {foo: 'bar'}).then(() => {
      assert(spy.calledOnce, 'Expected adapter to be called once')
      assert.deepEqual(spy.firstCall.args, [{
        queryString: {foo: 'bar'},
        method: 'get',
        endpoint: '/foo',
        url: '/api/kudu/v1/foo'
      }])
    })
  })

  it('Returns a promise which propagates errors when given a circular structure', () => {
    // If a circular structure is passed to `client.post`, deep-extend will currently fail with a
    // "Maximum call stack size exeeded`. This test asserts that this error is captured by the returned promise
    const connector = new Connector({adapter: {}})
    const client = new Client({service: new Service('kudu', 1), connector: connector})

    const circular = {}
    circular.prop = circular

    try {
      return client.post('/foo', circular).catch(error => {
        assert.equal(error.message, 'Maximum call stack size exceeded')
      })
    } catch (e) {
      return Promise.reject(new Error('Expected error to be captured by promise, instead it was thrown synchronously'))
    }
  })
})
