// This is the pebbles client class for the harlem pebble.
// Its a subclass of a pebbles-client/Client class and can be used like any ordinary client instance
"use strict";

var inherits = require("inherits");
var Client = require("../../client");

function ReaktorCoreClient() {
  Client.apply(this, arguments);
}
inherits(ReaktorCoreClient, Client);

ReaktorCoreClient.prototype.getRole = function getRole(realm, path) {
  return this.get("/roles/" + realm + "/" + (path || '*') + "/me");
};

ReaktorCoreClient.prototype.getUpgradeStateForCapability = function getUpgradeStateForCapability(capability, realm, path) {
  return this.getRole(realm, path).then(function(response) {
    var role = response.body;
    var hasCapability = role.capabilities.indexOf(capability) > -1;

    if (!hasCapability && !role.upgrades[capability]) {
      throw new Error("No upgrade path for capability " + JSON.stringify(capability) + ". This is most likely because the capability is invalid.");
    }
    return {
      role: role,
      hasCapability: hasCapability,
      nextUpgrade: role.upgrades[capability] && role.upgrades[capability][0],
      // note: we don't know the entire upgrade path.
      // i.e the user may not be logged in and only after login we may know the missing upgrades
      knownUpgrades: role.upgrades[capability]
    }
  });
};

module.exports = ReaktorCoreClient;
