# Changelog
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0] - 18-01-2016
### Breaking
- Removed support for passing `promiseImpl` as option to the httpAdapter. If you need to wrap values returned from client methods you are better off
being explicit about, e.g. `MyPromiseImpl.cast(pebbles.grove.get('/posts/post.foo:*')).map(val => ...)`
