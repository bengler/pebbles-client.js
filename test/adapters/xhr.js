var assert = require("assert")
var mock = require("mock");

describe("XHR HTTP Adapter", function () {
  it("requests", function (done) {
    var nativeResponse = {
      "statusText":"OK",
      "status": 200,
      "response": "{}",
      "responseType":"",
      "responseXML": "",
      "responseText":"{}",
      "withCredentials":true,
      "readyState":4,
      "timeout":5000,
      "onloadstart":null,
      "onloadend":null,
      "onabort":null,
      "url":"http://localhost:9966",
      "method":"GET",
      "headers":{
        "Accept":"application/json,text/plain,* / *"
      },
      getAllResponseHeaders: function() {
        return { 'Content-Type': 'application/json' }
      },
      "statusCode":200,
      "body":"{}"
    };

    var mockBody = {};
    var adapter = mock("../../adapters/xhr", {
      xhr: function (options, callback) {
        assert(typeof callback == 'function', "Expected callback to be function")

        assert.equal(options.cors, true);
        assert.equal(options.method, 'get');
        assert.equal(options.uri, 'http://pebblestack.org/foo');
        assert.deepEqual(options.headers, {
          Accept: 'application/json,text/plain,* / *'
        });

        callback(null, nativeResponse, mockBody)
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