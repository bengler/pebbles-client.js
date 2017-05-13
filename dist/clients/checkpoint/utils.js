'use strict';

var isBrowser = typeof window !== 'undefined';

// Returns a new function that throws an error if the given function is attempted called in a non-browser env.
function browserOnly(fn) {
  return function () {
    if (!isBrowser) {
      var fnName = fn.name || '<anonymous>';
      throw new Error('Attempted to call function \'' + fnName + '\', in a non-browser environment. ' + 'You probably want to wrap this call in a if (typeof window !== \'undefined\') {...} statement.');
    }

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return fn.call.apply(fn, [this].concat(args));
  };
}

function createLoginError(error) {
  error.code = 'LOGIN_ERROR';
  return error;
}

function getBody(response) {
  return response.body;
}

module.exports = {
  browserOnly: browserOnly,
  createLoginError: createLoginError,
  getBody: getBody
};