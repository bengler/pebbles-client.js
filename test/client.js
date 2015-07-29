var assert = require("assert")
var sinon = require("sinon")

var Client = require("../client")
var Service = require("../service");
var Connector = require("../connector");

describe("Client", function () {
  it("Forwards a request to an endpoint to a fully qualified service path", function() {
    var spy = sinon.spy();
    var mockAdapter = {
      stream: function() {
      },
      promise: function() {
        spy.apply(null, arguments);
      }
    };

    var connector = new Connector({adapter: mockAdapter});
    var client = new Client({service: new Service("kudu", 1), connector: connector});
    client.get("/foo");
    assert(spy.calledOnce);
    assert(spy.firstCall.args, ["get", "/api/kudu/v1/foo"])
  });

  it("Passes through request params", function() {
    var spy = sinon.spy();
    var mockAdapter = {
      stream: function() {
      },
      promise: function() {
        spy.apply(null, arguments);
      }
    };
    var connector = new Connector({adapter: mockAdapter});
    var client = new Client({service: new Service("kudu", 1), connector: connector});
    client.get("/foo", {foo: "bar"});

    assert(spy.calledOnce);
    assert.deepEqual(spy.firstCall.args, [{queryString: {foo: "bar"}, method: "get", endpoint: "/foo", url: "/api/kudu/v1/foo"}])
  })
});
