

const isBrowser = typeof window !== 'undefined'

// Returns a new function that throws an error if the given function is attempted called in a non-browser env.
function browserOnly(fn) {
  return function (...args) {
    if (!isBrowser) {
      const fnName = fn.name || '<anonymous>'
      throw new Error(`Attempted to call function '${fnName}', in a non-browser environment. `
        + 'You probably want to wrap this call in a if (typeof window !== \'undefined\') {...} statement.')
    }
    return fn.call(this, ...args)
  }
}

function createLoginError(error) {
  error.code = 'LOGIN_ERROR'
  return error
}

function getBody(response) {
  return response.body
}

module.exports = {
  browserOnly,
  createLoginError,
  getBody
}
