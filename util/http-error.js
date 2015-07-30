"use strict"

var inherits = require("inherits");

module.exports = HttpError;
module.exports.toHttpError = toHttpError;

function toHttpError(error, response) {
  var httpError = new HttpError(error.message, response);
  httpError.stack = error.stack;
  return httpError;
}

function HttpError(message, response) {
  this.name = 'HttpError';
  this.message = message;
  this.response = response;
  this.statusCode = this.status = response.statusCode;
}

inherits(HttpError, Error);
