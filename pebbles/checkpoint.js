var Service = require("../service");
var util = require("util");
var $ = require("jquery");

function CheckpointService() {
  Service.apply(this, arguments);
}

util.inherits(CheckpointService, Service);

CheckpointService.prototype.selectProvider = function () {
  throw "Not implemented.\nPlease implement this method in your app and make sure it returns a promise which\nresolves with the selected service";
};

CheckpointService.prototype._registerFocusMessageHandler = function () {
  this._registerFocusMessageHandler = Function.prototype;
  $(window).on("message", function (e) {
    if (e.data === 'checkpoint-login-success') {
      window.focus();
    }
  });
};

CheckpointService.prototype.login = function (provider, opts) {
  var deferred, params, poll, pollId, url, win, _this = this;
  opts || (opts = {});

  opts.pollInterval || (opts.pollInterval = 1000);
  opts.display || (opts.display = 'popup');

  if (provider == null) {
    return this.selectProvider().then(function (provider) {
      return _this.login(provider, opts);
    });
  }

  params = [];
  params.push("display=" + opts.display);

  if (opts.redirectTo != null) {
    params.push("redirect_to=" + opts.redirectTo);
  }

  url = this.pathTo("/login/" + provider + "?" + (params.join("&")));
  win = window.open(url, "checkpointlogin_" + new Date().getTime(), 'width=1024,height=800');
  this._registerFocusMessageHandler();
  deferred = $.Deferred();
  poll = function () {
    return _this.get("/identities/me").then(function (me) {
      var _ref1;
      if ((((_ref1 = me.identity) != null ? _ref1.id : void 0) != null) && !me.identity.provisional && me.accounts.indexOf(provider) > -1) {
        win.close();
        window.focus();
        deferred.resolve(me);
        clearInterval(pollId);
      }
      if (win.closed) {
        return deferred.reject("Login window closed by user");
      }
    });
  };
  pollId = setInterval(poll, opts.pollInterval);
  return deferred;
};

CheckpointService.prototype.logout = function () {
  return this.post("/logout");
};


module.exports = CheckpointService;
