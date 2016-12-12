const Client = require('../../client')
const url = require('url')
const {browserOnly, createLoginError, getBody} = require('./utils')

// todo: fix eslint errors
/* eslint-disable max-depth */


class CheckpointClient extends Client {
}

CheckpointClient.prototype.login = browserOnly(function (provider, opts) {

  // Defaults
  opts = opts || {}
  opts.pollInterval = opts.pollInterval > 100 ? opts.pollInterval : 1000
  opts.display = opts.display || 'popup'
  opts.timeout = opts.timeout || 1000 * 60 * 5

  if (provider === null) {
    throw new Error('Provider not selected')
  }

  const params = {}
  params.display = opts.display

  if (opts.redirectTo) {
    params.redirect_to = opts.redirectTo // eslint-disable-line camelcase
  }

  const loginEndpoint = this.urlTo(`/login/${provider}`, params)

  const win = window.open(loginEndpoint, `checkpointlogin_${(new Date()).getTime()}`, 'width=1024,height=800')

  if (!win) {
    const message = 'Could not open login window. This may be caused by an attempt to call window.open() without being'
      + ' in the call stack of an user event (e.g. onClick).'
      + ' Please make sure that no call to "checkpointClient.login()" are delayed (i.e. with setTimeout), but invoked '
      + ' synchronously in the call stack from the originating user event'

    return Promise.reject(new Error(message))
  }

  this._registerFocusMessageHandler()

  let pollTimerId

  const self = this

  return poll().then(done, error => {
    done()
    return Promise.reject(error)
  })

  function poll() {
    // Note: its important that we use setInterval and not setTimeout because Safari on IOS kills timeouts for good
    // when page is left in background. Intervals, however are resumed when the user returns to the page again.
    // We clear it here to avoid excessive polling (better to wait until the request returns before polling again)
    clearInterval(pollTimerId)

    return self.get('/identities/me')
      .then(getBody)
      .then(me => {
        if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
          return me
        }
        if (win.closed) {
          throw createLoginError(new Error('Login window closed by user', 'cancelled'))
        }
        if (me.identity && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
          return me
        }
        return new Promise((resolve, reject) => {
          pollTimerId = setInterval(() => {
            poll().then(resolve, reject)
          }, opts.pollInterval)
        })
      })
  }

  function done(result) {
    if (!win.closed) {
      win.close()
    }
    window.focus()
    return result
  }
})

CheckpointClient.prototype.logout = browserOnly(function () {
  return this.post('/logout')
})

CheckpointClient.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = () => {}
  window.addEventListener('message', e => {
    if (e.data === 'checkpoint-login-success') {
      window.focus()
    }
  })
}

// These methods checks/makes sure that a session has been set on the domain we are connecting to.
// Toghether they provide a workaround for a bug/problem with Safari on iOS that will omit sending cookie to a
// "thirdparty" domain. A "thirdparty" domain in this context means a domain that the browser has not previously visited.
// (Yeah, even when withCredentials=true, Safari on iOS 7 will omit cookies for x-domain requests to "thirdparty" domains)
CheckpointClient.prototype.checkSession = browserOnly(function checkSession() {
  const self = this
  // In case we have no session cookie set, this first request will set it
  return this.get('check-session')
    .then(response => {

      if (typeof response.body !== 'object' || !response.body.hasOwnProperty('ok')) {
        throw new Error(
          'Unexpected response from checkpoint. Expected a JSON object with an "ok" property, '
          + `instead got the ${typeof response.body} ${response.body}`
        )
      }
      // A session cookie was already set, all good
      if (response.body.ok) {
        return true
      }

      // Ok, we had no session cookie in our first attempt, check to see if it gets sent now.
      return self.get('check-session').then(resp => {
        // status.ok is true if cookie is set
        return resp.body.ok
      })
    })
})

const CHECKED_PARAM = '--checkpoint-session-checked'

CheckpointClient.prototype.ensureSession = browserOnly(function ensureSession() {

  const currentUrlParsed = url.parse(document.location.href, true)
  delete currentUrlParsed.search

  const isReturnedFromRedirect = currentUrlParsed.query[CHECKED_PARAM]

  const self = this
  return this.checkSession()
    .then(sessionReady => {
      if (!sessionReady) {
        // Browser is not sending any cookies to the domain. Booo :-(
        // We need to navigate to checkpoints /ensure-session endpont on the domain, specifying where to redirect after

        if (isReturnedFromRedirect) {
          // We have returned from a redirect to checkpoint/v1/check-session

          // Clean up after us (so that the _session_checked param is not passed along)
          delete currentUrlParsed.query[CHECKED_PARAM]
          try {
            window.history.replaceState({}, null, url.format(currentUrlParsed))
          } catch (e) {
            // Ignore
          }
          const domain = url.parse(self.connector.baseUrl).hostname
          const error = new Error(
            `Did return from an attempt to visit ${self.connector.baseUrl}, but cookies is still not sent properly. `
            + `This means the browser you are using is most likely blocking cookies from the domain ${domain}.`
          )
          error.code = 'THIRDPARTY_COOKIES_BLOCKED'
          error.data = {
            domain: domain
          }
          throw error
        }

        currentUrlParsed.query[CHECKED_PARAM] = true

        document.location.href = self.urlTo('check-session', {
          redirect_to: url.format(currentUrlParsed) // eslint-disable-line camelcase
        })
      }
    })
})

module.exports = CheckpointClient

CheckpointClient.isLoginError = error => {
  return error.code === 'LOGIN_ERROR'
}
