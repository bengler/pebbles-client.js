var assert = require("assert")
var mock = require("mock");

describe("Request HTTP Adapter", function () {
  it("requests", function () {
    var nativeResponse = {
      httpVersion: '1.1',
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      headers: {
        "content-type": "application/json"
      },
      statusCode: '200'
    };

    var mockResponse = {};

    var adapter = mock("../../adapters/node", {
      request: function (options, callback) {
        assert(typeof callback == 'function', "Expected callback to be function")

        assert.equal(options.json, true);
        assert.equal(options.method, 'get');
        assert.equal(options.agent, false);
        assert.equal(options.url, 'http://pebblestack.org/foo');

        callback(null, nativeResponse, mockResponse)
      }
    });

    return adapter({method: 'get', url: "http://pebblestack.org/foo"}).then(function (response) {
      assert.equal(response.body, mockResponse);
      assert.equal(response.statusCode, 200);
      assert.equal(response.statusText, "OK");
      assert.equal(response.headers['content-type'], "application/json");
      assert.equal(response.native, nativeResponse);
    })
  });
});