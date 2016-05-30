pebbles-client.js
===

Multi-environment JavaScript client for pebbles services

[![Build Status](https://travis-ci.org/bengler/pebbles-client.js.svg?branch=master)](https://travis-ci.org/bengler/pebbles-client.js)

## Usage example

### Instantiate a set of services

pebbles.checkpoint.request(options, callback)

```javascript
var Connector = require("pebbles-client").Connector;

var pebbles = new Connector({baseUrl: "http://pebbles.o5.no"}).use({
  checkpoint: 1,
  grove: 1
});

var checkpointClient = pebbles.checkpoint;
var groveClient = pebbles.grove;
```

# API

## Service

A service is a context free description of a web service. It does not include any details about where the service may be running,
so you can use the same service instance to make request to different locations.

The Service class may be subclassed in order to provide service specific helper methods, etc.

### Methods

#### service#urlTo(endpoint, queryParams)
Returns the path of the given endpoint, as specified by the pebbles convension `'/api/<service-name>/v<service-version>/<endpoint>`

```js
var service = new Service({name: 'foo', version: 1});
service.urlTo("/my/endpoint");
//=> "/api/foo/v1/my/endpoint"
```

## Connector

A connector represents a set of services, and their shared context, i.e.:

  * the domain they are residing on
  * the session token to use across all services

A connector is also responsible for calculating the full url of a service endpoint path, and delegating requests to the HTTP adapter

### Methods

### connector#urlTo(path, [queryparams])

Returns the fully qualified url to a given endpoint path

var pebbles = new Connector({baseUrl: "http://pebbles.o5.no"});
pebbles.urlTo('/foo/bar', {baz: 'qux'});

//=> "http://pebbles.o5.no/foo/bar?baz=qux"

### connector#<service>

Each configured service gets represented by a property on the connector instance.

var pebbles = {
  checkpoint: new CheckpointClient({connector: connector}),
  grove: new Client({connector: connector}),
  tiramisu: new TiramisuClient({connector: connector}),
}


```js
var pebbles = new Connector({baseUrl: "http://pebbles.o5.no"})
```

## Client

A client instance provides an api to make requests to a service

```js
var client = new Client({service: }

```

### client.request(options, callback)

```js
var options = {
  endpoint: "/posts/post:pebbles.foo.bar",
  method: "post",
  queryString: {foo: "bar"},
  body: {post: {document: "Hello world!"}}
}
pebbles.grove.request(options, function(err, result) {
  console.log(result)
});
```

This will issue a POST-request to `http://pebbles.o5.no/api/grove/v1/posts/post:pebbles.foo.bar?foo=bar` with the post body:

```json
{"post": {"document": "Hello world!"}}
```

The request will be issued with the `Content-Type` header set to `application/json`.

The options argument can be either an `endpoint` or an `options` object. The only required option is `endpoint`; all others are optional.

* `endpoint`: - path to a service endpoint.
* `queryString`: object containing queryString values to be appended to the endpoint url. Will be query string encoded if it is an object.
* `method` - http method (default: `"GET"`)
* `headers` - http headers (default: `{}`)
* `body` - entity body for PATCH, POST and PUT requests. If it is an object it will be `JSON.stringify()`´ed

The callback argument gets 3 arguments:

1. An `error` if something went wrong
1. The response `body` (JSON parsed)
1. The response object (as returned from the adapter - note: relying on this may break compatibility across js environments - be warned!)

### Shorthand methods

#### client.get(endpoint, [queryString], [options], [callback])

Calls client.get with an options object with the given `endpoint` and `queryString` properties set on the `options` object.

```js

client.get("/foo", {bar: "baz"}, { headers: { "X-FooBarHeader": "baz" } }, callback)
```
is equivalent to:
```js
client.request({
  method: "get"
  endpoint: "/foo",
  queryString: { bar: "baz" },
  headers: { "X-FooBarHeader": "baz" }
}, callback)

```

#### client.post(endpoint, [body], [options], [callback])

Calls `client.request` with an options object with the given `endpoint` and `body` properties set on the `options` object.

```js
client.post("/foo", {bar: "baz"}, { headers: { "X-FooBarHeader": "baz" } }, callback)
```
is equivalent to:
```js
client.request({
  method: "post"
  endpoint: "/foo",
  body: {bar: "baz"},
  headers: { "X-FooBarHeader": "baz" }
}, callback)
```

#### client.put(endpoint, [body], [options], [callback])

Same as client.post() but with `method: "put"`
#### client.del(endpoint, [queryString], [options], [callback])

Same as client.get() but with `method: "delete"`


### Resources

Defining a resource provides a simplified way of dealing with specific resource endpoints for a service

#### Example

```js
acks = pebbles.kudu.resource("/acks")

acks.list({offset: 0, limit: 10}, function(err, acks, response) {
  // The acks argument now contains the 10 first acks!
})

acks.post({value: 10}, function(err, ack) {
  if (!err) {
    // ack has been saved!
  }
})

acks.del(23, function(err, ack) {
  if (!err) {
    // Ack with id 23 is now successfully deleted
  }
})
```
