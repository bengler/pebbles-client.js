var inherits = require("inherits");

module.exports = RequestError;

function RequestError(message, response) {
  Error.call(this, message);
  this.response = response;
  this.statusCode = response.statusCode;
}

inherits(RequestError, Error);