"use strict";

var Client = require("../client");
var util = require("util");

function addListener(evnt, elem, func) {
  if (elem.addEventListener) elem.addEventListener(evnt,func,false);
  else if (elem.attachEvent) {
    return elem.attachEvent("on"+evnt, func);
  }
}

function CheckpointClient() {
  Client.apply(this, arguments);
}

util.inherits(CheckpointClient, Client);

CheckpointClient.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = Function.prototype;
  addListener(window, "message", function (e) {
    if (e.data === 'checkpoint-login-success') {
      window.focus();
    }
  });
};

CheckpointClient.prototype.login = function (provider, opts, cb) {
  opts || (opts = {});
  opts.pollInterval || (opts.pollInterval = 1000);
  opts.display || (opts.display = 'popup');
  cb || (cb = function() {});

  if (provider == null) {
    throw new Error("Provider not selected")
  }

  var params = [];
  params.push("display=" + opts.display);

  if (opts.redirectTo) {
    params.push("redirect_to=" + opts.redirectTo);
  }

  var url = this.urlTo("/login/" + provider + "?" + (params.join("&")));

  var win = window.open(url, "checkpointlogin_" + (new Date()).getTime(), 'width=1024,height=800');

  this._registerFocusMessageHandler();
  
  var pollId = setInterval(poll.bind(this), opts.pollInterval);

  function stop(err, me) {
    if (!win.closed) win.close();
    window.focus();
    clearInterval(pollId);
    cb(err, me);
  }

  function poll() {
    if (win.closed) {
      stop("Login window closed by user");
    }
    this.get("/identities/me", function(err, me) {
      console.log(me)
      if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        stop(null, me);
      }
    });
  };
};

CheckpointClient.prototype.logout = function () {
  return this.post("/logout");
};


module.exports = CheckpointClient;