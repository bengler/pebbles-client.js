pebbles-client.js
===

Multi-environment JavaScript client for pebbles services

Work in progress.

## Usage example

### Instantiate a set of services

```javascript
var ServiceSet = require("pebbles-client").ServiceSet;

var services = new ServiceSet({rootUrl: "http://pebbles.o5.no"}).use({
  checkpoint: 1,
  grove: 1
});
```

### Simple example

Note: At the moment, only Node.js-style callback asynchronity is supported. Promises and streams are coming soon!

```javascript
services.checkpoint.get("/identities/me", function(err, me) {
  console.log("Hello there "+me.profile.name) 
})
```

### Request parameters 

```javascript
var post = {
  document: {
    title: "Hello world!"
  }
}

services.grove.post("/posts/foo.bar:baz.qux", {post: post}, function(err, post) {
  console.log("Post was saved. Check it out: ", post) 
})
```

### Custom headers

```javascript
var headers = {
  "X-My-Header": "foobar"
}

services.checkpoint.get("/identities/me", null, {headers: headers}, function(err, me) {
  console.log("A request was just issued with a custom header")
})
```
