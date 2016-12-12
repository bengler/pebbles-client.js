const extend = require('xtend/mutable')

module.exports = function toHttpError(error, response) {
  return extend(error, {
    code: 'HTTP_ERROR',
    response: response,
    status: response.statusCode,
    statusCode: response.statusCode,
  })
}
