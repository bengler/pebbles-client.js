"use strict";

var Client = require("../../client");
var inherits = require("inherits");
var JSONStream = require('json-stream');
var url = require("url");

var ProgressStream = require("./iframe-progress-stream");

module.exports = TiramisuIframeClient;

function TiramisuIframeClient() {
  Client.apply(this, arguments);
}

inherits(TiramisuIframeClient, Client);

/**
 * Overrides attributes in a dom element returning a hash with overridden attributes and their original values
 * @param elem
 * @param attrs
 * @return {Object}
 */
function overrideAttrs(elem, attrs) {
  var overridden = {};
  for (var attr in attrs) if (attrs.hasOwnProperty(attr)) {
    var newValue = attrs[attr];
    overridden[attr] = elem.getAttribute(attr);
    if (newValue == null)
      elem.removeAttribute(attr);
    else
      elem.setAttribute(attr, newValue);
  }
  return overridden;
}

TiramisuIframeClient.prototype.upload = function (endpoint, fileField) {
  var iframeName = 'pebbles_iframe_uploader' + Math.random().toString(36).substring(2);
  var iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  var form = fileField.form;

  var actionUrl = url.parse(this.urlTo(endpoint), true);
  actionUrl.query.postmessage = true;
  var overriddenAttrs = overrideAttrs(form, {
    method: 'post',
    target: iframeName,
    action: url.format(actionUrl),
    enctype: 'multipart/form-data'
  });

  var origin = (actionUrl.protocol||document.location.protocol)+"//"+(actionUrl.host || document.location.host);
  if (actionUrl.port) origin += ":"+actionUrl.port
  var progress = new ProgressStream(iframe, origin);
  var error = null;
  progress.on('error', function (e) {
    error = e;
  });
  if (typeof cb == 'function') {
    progress.on('end', function (body) {
      cb(error, body, progress);
    });
  }

  progress.on('end', function (body) {
    overrideAttrs(form, overriddenAttrs)
  });

  form.submit();
  return progress.pipe(new JSONStream())
};

