"use strict";

var Client = require("../../client");
var inherits = require("inherits");


var utils = require("./utils");
var browserOnly = utils.browserOnly;
var LoginError = require("./login-error");

function getBody(response) {
  return response.body;
}

function CheckpointClient() {
  Client.apply(this, arguments);
}

inherits(CheckpointClient, Client);

CheckpointClient.prototype.login = browserOnly(function (provider, opts) {

  // Defaults
  opts || (opts = {});
  opts.pollInterval || (opts.pollInterval = 1000);
  opts.display || (opts.display = 'popup');  
  opts.timeout || (opts.timeout = 1000*60*2);  

  if (provider == null) {
    throw new Error("Provider not selected")
  }

  var params = {};
  params.display= opts.display;

  if (opts.redirectTo) {
    params.redirect_to = encodeURIComponent(opts.redirectTo);
  }

  var url = this.urlTo("/login/" + provider, params);

  var win = window.open(url, "checkpointlogin_" + (new Date()).getTime(), 'width=1024,height=800');

  this._registerFocusMessageHandler();

  var pollTimerId;
  var _this = this;

  return poll().then(done, function onRejected(error) {
      done();
      return Promise.reject(error);
    });
  
  function poll() {
    // Note: its important that we use setInterval and not setTimeout because Safari on IOS kills timeouts for good
    // when page is left in background. Intervals, however are resumed when the user returns to the page again.
    // We clear it here to avoid excessive polling (better to wait until the request returns before polling again)
    clearInterval(pollTimerId);

    return _this.get("/identities/me").then(getBody).then(function(me) {
      if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        return me;
      }
      if (win.closed) {
        throw new LoginError("Login window closed by user", 'cancelled');
      }
      return new Promise(function (resolve, reject) {
        if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
          return me;
        }
        pollTimerId = setInterval(function() {
          poll().then(resolve, reject)
        }, opts.pollInterval);
      });
    });
  }

  function done(result) {
    if (!win.closed) {
      win.close();
    }
    window.focus();
    return result;
  }
});

CheckpointClient.prototype.logout = browserOnly(function () {
  return this.post("/logout");
});

CheckpointClient.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = Function.prototype;
  utils.addListener(window, "message", function (e) {
    if (e.data === 'checkpoint-login-success') {
      window.focus();
    }
  });
};

// These methods checks/makes sure that a session has been set on the domain we are connecting to.
// Toghether they provide a workaround for a bug/problem with Safari on iOS that will omit sending cookie to a
// "thirdparty" domain. A "thirdparty" domain in this context means a domain that the browser has not previously visited.
// (Yeah, even when withCredentials=true, Safari on iOS 7 will omit cookies for x-domain requests to "thirdparty" domains)
CheckpointClient.prototype.checkSession = browserOnly(function checkSession() {
  var _this = this;
  // In case we have no session cookie set, this first request will set it
  return this.get('check-session')
    .then(function(response) {

      // A session cookie was already set, all good 
      if (response.body.ok) {
        return true;
      }

      // Ok, we had no session cookie in our first attempt, check to see if it gets sent now.   
      return _this.get('check-session').then(function(response) {
        // status.ok is true if cookie is set
        return response.body.ok;
      })
  });
});

CheckpointClient.prototype.ensureSession = browserOnly(function ensureSession() {
  var _this = this;
  this.checkSession()
    .then(function(sessionReady) {
      if (!sessionReady) {
        // Browser is not sending any cookies to the domain. Booo :-(
        // We need to navigate to checkpoints /ensure-session endpont on the domain, specifying where to redirect after
        document.location.href = _this.urlTo("check-session", { redirect_to: document.location.href })
      }
    })
    .catch(function(err) {
      console.warn("Warning: Unable to ensure session. Details: "+err.stack);
    });
});

module.exports = CheckpointClient;

CheckpointClient.LoginError = LoginError;
