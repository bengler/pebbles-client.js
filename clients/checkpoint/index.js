"use strict";

var Client = require("../../client");
var inherits = require("inherits");

var url = require("url");
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
  opts = opts || {};
  opts.pollInterval = opts.pollInterval > 100 ? opts.pollInterval : 1000;
  opts.display = opts.display || 'popup';
  opts.timeout = opts.timeout || 1000 * 60 * 5;

  if (provider === null) {
    throw new Error("Provider not selected")
  }

  var params = {};
  params.display = opts.display;

  if (opts.redirectTo) {
    params.redirect_to = opts.redirectTo; // eslint-disable-line camelcase
  }

  var loginEndpoint = this.urlTo("/login/" + provider, params);

  if (opts.inSameWindow) {
    window.location = loginEndpoint;
    return Promise.resolve();
  }
  var win = window.open(loginEndpoint, "checkpointlogin_" + (new Date()).getTime(), 'width=1024,height=800');

  if (!win) {
    var message = 'Could not open login window. This may be caused by an attempt to call window.open() without being' +
      ' in the call stack of an user event (e.g. onClick).' +
      ' Please make sure that no call to "checkpointClient.login()" are delayed (i.e. with setTimeout), but invoked ' +
      ' synchronously in the call stack from the originating user event';

    return Promise.reject(new Error(message));
  }

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

    return _this.get("/identities/me").then(getBody).then(function (me) {
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
        pollTimerId = setInterval(function () {
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
    .then(function (response) {

      if (typeof response.body !== 'object' || !response.body.hasOwnProperty('ok')) {
        throw new Error("Unexpected response from checkpoint. Expected a JSON object with an `ok` property, instead got the " + (typeof response.body) + " " + response.body);
      }
      // A session cookie was already set, all good
      if (response.body.ok) {
        return true;
      }

      // Ok, we had no session cookie in our first attempt, check to see if it gets sent now.
      return _this.get('check-session').then(function (resp) {
        // status.ok is true if cookie is set
        return resp.body.ok;
      })
    });
});

var CHECKED_PARAM = "--checkpoint-session-checked";

CheckpointClient.prototype.ensureSession = browserOnly(function ensureSession() {

  var currentUrlParsed = url.parse(document.location.href, true);
  delete currentUrlParsed.search;

  var isReturnedFromRedirect = currentUrlParsed.query[CHECKED_PARAM];

  var _this = this;
  return this.checkSession()
    .then(function (sessionReady) {
      if (!sessionReady) {
        // Browser is not sending any cookies to the domain. Booo :-(
        // We need to navigate to checkpoints /ensure-session endpont on the domain, specifying where to redirect after

        if (isReturnedFromRedirect) {
          // We have returned from a redirect to checkpoint/v1/check-session

          // Clean up after us (so that the _session_checked param is not passed along)
          delete currentUrlParsed.query[CHECKED_PARAM];
          try {
            window.history.replaceState({}, null, url.format(currentUrlParsed));
          }
          catch (e) {
            // Ignore
          }
          var domain = url.parse(_this.connector.baseUrl).hostname;
          var error = new Error(
            "Did return from an attempt to visit " + _this.connector.baseUrl + ", but cookies is still not sent properly. " +
            "This means the browser you are using is most likely blocking cookies from the domain " + domain + "."
          );
          error.code = "THIRDPARTY_COOKIES_BLOCKED";
          error.data = {
            domain: domain
          };
          throw error;
        }

        currentUrlParsed.query[CHECKED_PARAM] = true;

        document.location.href = _this.urlTo("check-session", {
          redirect_to: url.format(currentUrlParsed) // eslint-disable-line camelcase
        })
      }
    })
});

module.exports = CheckpointClient;

CheckpointClient.LoginError = LoginError;
