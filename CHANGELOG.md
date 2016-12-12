# Changelog
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.1] - 12-12-2016
- Avoid usage of `[].findIndex` for es5 compat
- Run tests with babel-register

## [3.0.0] - 12-12-2016
### Breaking changes
- HTTP errors are no longer instances of HTTPError, but rather have a code property set to `HTTP_ERROR`
- CheckpointClient does not expose LoginError anymore. Use `CheckpointClient.isLoginError(error)` to check if an error is a Login error

### Minor changes
- Migrate codebase to ES6 using Babel
- Remove use of legacy eslint config and fix lint errors

## [2.0.4] - 12-12-2016
- Use pumpify for stream error propagation

## [2.0.3] - 29-09-2016
- Fix broken chunks concatenation in node
- Drop Travis CI support for node v0.10, v0.12, v5, keep v4 and add v6

## [2.0.2] - 12-08-2016
- Remove unused es6-promise and obsolete es6-shim
- Update duplexify. Fixes Node >= 6 issues

## [2.0.1] - 30-05-2016
Fixes issue with MS Edge: For some reason edge reported an empty line in xhr.responseText, which in turn caused image uploading to be broken.

## [2.0.0] - 18-01-2016
### Breaking
- Removed support for passing `promiseImpl` as option to the httpAdapter. If you need to wrap values returned from client methods you are better off
being explicit about, e.g. `MyPromiseImpl.cast(pebbles.grove.get('/posts/post.foo:*')).map(val => ...)`
