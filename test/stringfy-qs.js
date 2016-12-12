

const assert = require('assert')
const stringifyQs = require('../src/util/stringify-qs')

describe('stringify', () => {
  it('returns empty string for empty object', () => {
    assert.equal(stringifyQs({}), '')
  })

  it('stringifies shallow', () => {
    assert.equal(stringifyQs({foo: 'bar'}), 'foo=bar')
  })

  it('stringifies deep query params', () => {
    assert.equal(stringifyQs({
      foo: 'bar',
      bar: {baz: 'qux'}
    }), 'foo=bar&bar[baz]=qux')
  })

  it('stringifies arrays too', () => {
    assert.equal(stringifyQs({
      foo: 'bar',
      bar: {baz: 'qux'}
    }), 'foo=bar&bar[baz]=qux')
  })

  it('stringifies arrays too', () => {
    assert.equal(stringifyQs({
      foo: 'bar',
      arr: [1, 2, 3]
    }), 'foo=bar&arr[]=1&arr[]=2&arr[]=3')
  })

  it('stringifies deeply nested arrays too', () => {
    assert.equal(stringifyQs({
      foo: 'bar',
      arr: [1, {x: 'y'}, 3]
    }), 'foo=bar&arr[]=1&arr[][x]=y&arr[]=3')
  })
})
