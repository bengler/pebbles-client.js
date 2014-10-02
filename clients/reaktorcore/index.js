"use strict";

var extend = require("xtend");
var Client = require("../../client");
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

ReaktorCoreClient.prototype.getRole = function getRole() {
  return this.get("/roles/"+this.realm+"/"+this.publication+"/me").then(function(response) {
    return response.body;
  });
};

ReaktorCoreClient.prototype.setUpgrader = function setUpgrader(upgrade, upgrader) {
  this.upgraders[upgrade] = upgrader;
};

ReaktorCoreClient.prototype.upgrade = function upgrade(upgradeName, opts) {
  var upgrader = this.upgraders[upgradeName];
  if (!upgrader) throw Error("No registered upgrade `"+upgradeName+"` for ReaktorCore client. Cannot continue.");
  return upgrader(opts);
};

ReaktorCoreClient.prototype.requireCapability = function requireCapability(capability, opts) {
  var _this = this;
  this.getRole().then(function(role) {
    if (hasCapability(role, capability)) {
      // Current user has got the requested capability!
      return role;
    }
    if (!role.upgrades[capability]) {
      return Promise.reject(new Error("Current user has no upgrade path for capability `"+capability+"`"));
    }
    // Level up!
    var upgradeName = role.upgrades[capability][0];
    return _this.upgrade(upgradeName, opts[upgradeName] || {}).then(function() {
      // Role should now have been upgraded one level, proceed to next level (or finish) by calling requireCapability again
      return _this.requireCapability(capability, opts);
    });
  });
};

module.exports = ReaktorCoreClient;