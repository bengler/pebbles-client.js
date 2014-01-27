"use strict";

var extend = require("util-extend");
var Client = require("../client");
var inherits = require("inherits");

function hasCapability(role, capability) {
  return role.capabilities.indexOf(capability) > -1;
}

function ReaktorCoreClient(opts) {
  Client.apply(this, arguments);
  opts || (opts = {});
  if (!(opts.realm && opts.publication)) {
    throw new Error("Reaktor Core client requires both realm and publication!");
  }
  this.realm = opts.realm;
  this.publication = opts.publication;
  this.upgraders = {};
}
inherits(ReaktorCoreClient, Client);

ReaktorCoreClient.prototype.getRole = function getRole(callback) {
  this.get("/roles/"+this.realm+"/"+this.publication+"/me", callback)
};

ReaktorCoreClient.prototype.setUpgrader = function setUpgrader(upgrade, upgrader) {
  this.upgraders[upgrade] = upgrader;
};

ReaktorCoreClient.prototype.upgrade = function upgrade(upgradeName, opts, callback) {
  var upgrader = this.upgraders[upgradeName];
  if (!upgrader) throw Error("No registered upgrade `"+upgradeName+"` for ReaktorCore client. Cannot continue.");
  return upgrader(opts, callback);
};

ReaktorCoreClient.prototype.requireCapability = function requireCapability(capability, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  var _this = this;
  this.getRole(function(err, role) {
    if (err) return callback(err, role);
    if (hasCapability(role, capability)) {
      // Current user has got the requested capability!
      return callback(null, role)
    }
    if (!role.upgrades[capability]) {
      return callback(new Error("Current user has no upgrade path for capability `"+capability+"`"));
    }
    // Level up!
    var upgradeName = role.upgrades[capability][0];
    console.log(upgradeName, opts)
    _this.upgrade(upgradeName, opts[upgradeName] || {}, function(err, result) {
      if (err) return callback(err, result);
      // Role should now have been upgraded one level, proceed to next level (or finish) by calling requireCapability again
      _this.requireCapability(capability, opts, callback);
    });
  });
};

module.exports = ReaktorCoreClient;