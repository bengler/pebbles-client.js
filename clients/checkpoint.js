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

  var stopped = false;
  function stop(err, args) {
    if (stopped) return;
    stopped = true;
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

// These methods checks/makes sure that a session has been set on the domain we are connecting to.
// Toghether they provide a workaround for a bug/problem with Safari on iOS that will omit sending cookie to a
// "thirdparty" domain. A "thirdparty" domain in this context means a domain that the browser has not previously visited.
// (Yeah, even when withCredentials=true, Safari on iOS 7 will omit cookies for x-domain requests to "thirdparty" domains)
CheckpointClient.prototype.checkSession = function checkSession(cb) {
  var _this = this;
  // In case we have no session cookie set, this first request will set it
  this.get('check-session', function(err, status) {
    if (err) return cb(err);
    // A session cookie was already set, all good 
    if (status.ok) return cb(null, true);

    // Ok, we had no session cookie in our first attempt, check to see if it gets sent now.   
    _this.get('check-session', function(err, status) {
      if (err) return cb(err);
      // status.ok is true if cookie is set
      cb(null, status.ok);
    })
  });
};

CheckpointClient.prototype.ensureSession = function ensureSession() {
  var _this = this;
  this.checkSession(function(err, isSessionReady) {
    if (!isSessionReady) {
      // Browser is not sending any cookies to the domain. Booo :-(
      // We need to navigate to checkpoints /ensure-session endpont on the domain, specifying where to redirect after
      document.location.href = _this.urlTo("check-session", { redirect_to: document.location.href })
    }
  })
};

module.exports = CheckpointClient;
