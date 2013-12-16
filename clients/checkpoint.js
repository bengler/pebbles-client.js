"use strict";

var Client = require("../client");
var inherits = require("inherits");

function addListener(evnt, elem, func) {
  if (elem.addEventListener) elem.addEventListener(evnt,func,false);
  else if (elem.attachEvent) {
    return elem.attachEvent("on"+evnt, func);
  }
}

function CheckpointClient() {
  Client.apply(this, arguments);
}

inherits(CheckpointClient, Client);

CheckpointClient.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = Function.prototype;
  addListener(window, "message", function (e) {
    if (e.data === 'checkpoint-login-success') {
      window.focus();
    }
  });
};

CheckpointClient.prototype.login = function (provider, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  // Defaults
  opts || (opts = {});
  opts.pollInterval || (opts.pollInterval = 1000);
  opts.display || (opts.display = 'popup');  

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

  function stop(err, args) {
    if (!win.closed) win.close();
    window.focus();
    clearInterval(pollId);
    if (callback) {
      callback.apply(callback, arguments);
    } 
    else if (err) throw err;
  }

  function poll() {
    if (win.closed) {
      stop(new Error("Login window closed by user"), { status: 'cancelled' });
    }
    this.get("/identities/me", function(err, me) {
      if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        stop(null, me);
      }
    });
  }
};

CheckpointClient.prototype.logout = function (cb) {
  return this.post("/logout", cb);
};


module.exports = CheckpointClient;
