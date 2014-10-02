var inherits = require("inherits");

module.exports = HttpError;

function HttpError(message, response) {
  Error.call(this, message);
  this.response = response;
  this.statusCode = response.statusCode;
}

inherits(HttpError, Error);