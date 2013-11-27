var assert = require("assert")
var sinon = require("sinon")

var Client = require("../client")
var Service = require("../service");

describe("Client", function () {

  it("Forwards a request to an endpoint to a fully qualified service path", function() {
    var mockAdapter = sinon.spy()
    var client = new Client({service: new Service("kudu", 1), adapter: mockAdapter});
    client.get("/foo");
    assert(mockAdapter.calledOnce)
    assert(mockAdapter.firstCall.args, ["get", "/api/kudu/v1/foo"])    
  });

  it("Passes through request params", function() {
    var mockAdapter = sinon.spy()
    var client = new Client({service: new Service("kudu", 1), adapter: mockAdapter});
    client.get("/foo", {foo: "bar"});
    assert(mockAdapter.calledOnce)    
    assert.deepEqual(mockAdapter.firstCall.args, ["get", "/api/kudu/v1/foo", {foo: "bar"}])    
  })
});
