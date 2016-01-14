"use strict"

var assert = require("assert")
var sinon = require("sinon")

var Client = require("../client")
var Service = require("../service");
var Connector = require("../connector");

describe("Client", function () {
  it("Forwards a request to an endpoint to a fully qualified service path", function () {
    var spy = sinon.spy();
    var mockAdapter = {
      promise: spy
    };

    var connector = new Connector({adapter: mockAdapter});
    var client = new Client({service: new Service("kudu", 1), connector: connector});
    return client.get("/foo").then(function () {
      assert(spy.calledOnce);
      assert(spy.firstCall.args, ["get", "/api/kudu/v1/foo"])
    });
  });

  it("Passes through request params", function () {
    var spy = sinon.spy();
    var mockAdapter = {
      promise: spy
    };
    var connector = new Connector({adapter: mockAdapter});
    var client = new Client({service: new Service("kudu", 1), connector: connector});

    return client.get("/foo", {foo: "bar"}).then(function () {
      assert(spy.calledOnce, 'Expected adapter to be called once');
      assert.deepEqual(spy.firstCall.args, [{
        queryString: {foo: "bar"},
        method: "get",
        endpoint: "/foo",
        url: "/api/kudu/v1/foo"
      }])
    })
  })

  it("Returns a promise which propagates errors when given a circular structure", function () {
    // If a circular structure is passed to `client.post`, deep-extend will currently fail with a
    // "Maximum call stack size exeeded`. This test asserts that this error is captured by the returned promise
    var connector = new Connector({adapter: {}})
    var client = new Client({service: new Service("kudu", 1), connector: connector})

    var circular = {}
    circular.prop = circular

    try {
      return client.post("/foo", circular).catch(function (error) {
        assert.equal(error.message, 'Maximum call stack size exceeded')
      })
    }
    catch (e) {
      return Promise.reject(new Error('Expected error to be captured by promise, instead it was thrown synchronously'))
    }
  })
})
