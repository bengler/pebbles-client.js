var inherits = require("inherits");

function LoginError(message, code) {
  Error.call(this);
  this.message = message;
  this.code = code;
}

inherits(LoginError, Error);

module.exports = LoginError;
