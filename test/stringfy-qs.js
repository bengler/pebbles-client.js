var assert = require("assert")
var stringifyQs = require("../util/stringify-qs");

describe("stringify", function () {
  it("stringifies shallow", function() {
    assert.equal(stringifyQs({foo: 'bar'}), "foo=bar");
  });

  it("stringifies deep query params", function() {
    assert.equal(stringifyQs({
      foo: 'bar',
      bar: {baz: 'qux'}
    }), "foo=bar&bar[baz]=qux");
  });

  it("stringifies arrays too", function() {
    assert.equal(stringifyQs({
      foo: 'bar',
      bar: {baz: 'qux'}
    }), "foo=bar&bar[baz]=qux");
  });

  it("stringifies arrays too", function() {
    assert.equal(stringifyQs({
      foo: 'bar',
      arr: [1,2,3]
    }), "foo=bar&arr[]=1&arr[]=2&arr[]=3");
  });

  it("stringifies deeply nested arrays too", function() {
    assert.equal(stringifyQs({
      foo: 'bar',
      arr: [1,{x: "y"},3]
    }), "foo=bar&arr[]=1&arr[][x]=y&arr[]=3");
  });
});
