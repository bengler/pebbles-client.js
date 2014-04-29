pebbles-client.js
===

Multi-environment JavaScript client for pebbles services

Work in progress.

## Usage example

### Instantiate a set of pebble services


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
Note: At the moment, only Node.js-style callback asynchronity is supported. Promises and streams are coming soon!

## Client

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
