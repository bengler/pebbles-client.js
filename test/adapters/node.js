var assert = require("assert")
var mock = require("mock");
var through = require("through2");
// Can't use immutable to add properties to a stream object
var extend = require("xtend/mutable");
var http = require("http");

describe("Node HTTP Adapter", function () {
  it("requests", function () {
    var nativeResponse = extend(through(), {
        headers: {},
        statusCode: 200,
        statusText: 'OK'
    });

    var adapter = mock("../../adapters/node-http", {
      http: extend(http, {
        request: function (options) {
          var mockReq = through();
          process.nextTick(function() {
            mockReq.emit('response', nativeResponse);
            process.nextTick(function() {
              nativeResponse.push("foo");
              nativeResponse.end();
            });
          });
          return mockReq;
        }
      })
    });

    return adapter.promise({method: 'get', url: "http://pebblestack.org/foo"}).then(function (response) {
      assert.equal(response.body, "foo");
      assert.equal(response.statusCode, 200);
      assert.equal(response.statusText, "OK");
      assert.equal(response._native, nativeResponse);
    })
  });
});
