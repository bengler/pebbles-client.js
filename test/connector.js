var assert = require("assert")
var sinon = require("sinon")

var Connector = require("../connector")
var Service = require("../service");

describe("Connector", function () {

  it("Forwards a request to an endpoint to a fully qualified service path", function() {
    var mockClient = {request: sinon.spy()}
    var connector = new Connector({service: new Service("kudu", 1), client: mockClient});
    connector.get("/foo");
    assert(mockClient.request.calledOnce)
    assert(mockClient.request.firstCall.args, ["get", "/api/kudu/v1/foo"])    
  });

  it("Passes through request params", function() {
    var mockClient = {request: sinon.spy()}
    var connector = new Connector({service: new Service("kudu", 1), client: mockClient});
    connector.get("/foo", {foo: "bar"});
    assert(mockClient.request.calledOnce)    
    assert.deepEqual(mockClient.request.firstCall.args, ["get", "/api/kudu/v1/foo", {foo: "bar"}])    
  })
});
