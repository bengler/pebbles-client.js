var inherits = require("inherits");

function LoginError(message, status) {
  Error.call(this, message);
  this.status = status;
}

inherits(LoginError, Error);

module.exports = LoginError;
