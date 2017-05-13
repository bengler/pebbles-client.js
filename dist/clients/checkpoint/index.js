'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Client = require('../../client');
var url = require('url');

var _require = require('./utils'),
    browserOnly = _require.browserOnly,
    createLoginError = _require.createLoginError,
    getBody = _require.getBody;

// todo: fix eslint errors
/* eslint-disable max-depth */

var CheckpointClient = function (_Client) {
  _inherits(CheckpointClient, _Client);

  function CheckpointClient() {
    _classCallCheck(this, CheckpointClient);

    return _possibleConstructorReturn(this, (CheckpointClient.__proto__ || Object.getPrototypeOf(CheckpointClient)).apply(this, arguments));
  }

  return CheckpointClient;
}(Client);

CheckpointClient.prototype.login = browserOnly(function (provider, opts) {

  // Defaults
  opts = opts || {};
  opts.pollInterval = opts.pollInterval > 100 ? opts.pollInterval : 1000;
  opts.display = opts.display || 'popup';
  opts.timeout = opts.timeout || 1000 * 60 * 5;

  if (provider === null) {
    throw new Error('Provider not selected');
  }

  var params = {};
  params.display = opts.display;

  if (opts.redirectTo) {
    params.redirect_to = opts.redirectTo; // eslint-disable-line camelcase
  }

  var loginEndpoint = this.urlTo('/login/' + provider, params);

  var win = window.open(loginEndpoint, 'checkpointlogin_' + new Date().getTime(), 'width=1024,height=800');

  if (!win) {
    var message = 'Could not open login window. This may be caused by an attempt to call window.open() without being' + ' in the call stack of an user event (e.g. onClick).' + ' Please make sure that no call to "checkpointClient.login()" are delayed (i.e. with setTimeout), but invoked ' + ' synchronously in the call stack from the originating user event';

    return Promise.reject(new Error(message));
  }

  this._registerFocusMessageHandler();

  var pollTimerId = void 0;

  var self = this;

  return poll().then(done, function (error) {
    done();
    return Promise.reject(error);
  });

  function poll() {
    // Note: its important that we use setInterval and not setTimeout because Safari on IOS kills timeouts for good
    // when page is left in background. Intervals, however are resumed when the user returns to the page again.
    // We clear it here to avoid excessive polling (better to wait until the request returns before polling again)
    clearInterval(pollTimerId);

    return self.get('/identities/me').then(getBody).then(function (me) {
      if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        return me;
      }
      if (win.closed) {
        throw createLoginError(new Error('Login window closed by user', 'cancelled'));
      }
      if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        return me;
      }
      return new Promise(function (resolve, reject) {
        pollTimerId = setInterval(function () {
          poll().then(resolve, reject);
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
  return this.post('/logout');
});

CheckpointClient.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = function () {};
  window.addEventListener('message', function (e) {
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
  var self = this;
  // In case we have no session cookie set, this first request will set it
  return this.get('check-session').then(function (response) {

    if (_typeof(response.body) !== 'object' || !response.body.hasOwnProperty('ok')) {
      throw new Error('Unexpected response from checkpoint. Expected a JSON object with an "ok" property, ' + ('instead got the ' + _typeof(response.body) + ' ' + response.body));
    }
    // A session cookie was already set, all good
    if (response.body.ok) {
      return true;
    }

    // Ok, we had no session cookie in our first attempt, check to see if it gets sent now.
    return self.get('check-session').then(function (resp) {
      // status.ok is true if cookie is set
      return resp.body.ok;
    });
  });
});

var CHECKED_PARAM = '--checkpoint-session-checked';

CheckpointClient.prototype.ensureSession = browserOnly(function ensureSession() {

  var currentUrlParsed = url.parse(document.location.href, true);
  delete currentUrlParsed.search;

  var isReturnedFromRedirect = currentUrlParsed.query[CHECKED_PARAM];

  var self = this;
  return this.checkSession().then(function (sessionReady) {
    if (!sessionReady) {
      // Browser is not sending any cookies to the domain. Booo :-(
      // We need to navigate to checkpoints /ensure-session endpont on the domain, specifying where to redirect after

      if (isReturnedFromRedirect) {
        // We have returned from a redirect to checkpoint/v1/check-session

        // Clean up after us (so that the _session_checked param is not passed along)
        delete currentUrlParsed.query[CHECKED_PARAM];
        try {
          window.history.replaceState({}, null, url.format(currentUrlParsed));
        } catch (e) {
          // Ignore
        }
        var domain = url.parse(self.connector.baseUrl).hostname;
        var error = new Error('Did return from an attempt to visit ' + self.connector.baseUrl + ', but cookies is still not sent properly. ' + ('This means the browser you are using is most likely blocking cookies from the domain ' + domain + '.'));
        error.code = 'THIRDPARTY_COOKIES_BLOCKED';
        error.data = {
          domain: domain
        };
        throw error;
      }

      currentUrlParsed.query[CHECKED_PARAM] = true;

      document.location.href = self.urlTo('check-session', {
        redirect_to: url.format(currentUrlParsed) // eslint-disable-line camelcase
      });
    }
  });
});

module.exports = CheckpointClient;

CheckpointClient.isLoginError = function (error) {
  return error.code === 'LOGIN_ERROR';
};