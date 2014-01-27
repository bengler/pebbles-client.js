var assert = require("assert")
var mock = require("mock");

var adapterFactory = require("../../adapters/angular");

describe("Angular $http adapter", function () {
  it("requests", function (done) {
    var nativeResponse = {
      headers: function(header) {
        var data = { "Content-Type": "application/json" } 
        return header ? data[header] : data;
      },
      statusCode: '200',
      body: 'OK'
    };

    var mockBody = {};
    var adapter = adapterFactory(function $mockHTTP(options) {

      assert.equal(options.withCredentials, true, "Expected withCredentials flag to be true");
      assert.equal(options.method, 'GET');
      assert.equal(options.url, 'http://pebblestack.org/foo');
      assert.deepEqual(options.headers, {
        Accept: 'application/json,text/plain,* / *'
      });

      return {
        success: function(callback) {
          assert(typeof callback == 'function', "Expected callback to be function")
          callback(mockBody, 200, nativeResponse.headers, nativeResponse)
        },
        error: function noop() {}
      }
      

    });

    adapter({method: 'get', url: "http://pebblestack.org/foo"}, function (err, body, response) {
      assert.equal(err, null);
      assert.equal(body, mockBody);
      assert.equal(response.statusCode, 200);
      assert.equal(response.statusText, "OK");
      assert.equal(response.headers['content-type'], "application/json");
      assert.equal(response.native, nativeResponse);
      done()
    })
  });
});