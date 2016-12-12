const Client = require('../../client')

module.exports = class ReaktorCoreClient extends Client {
  getRole(realm, path) {
    return this.get(`/roles/${realm}/${path || '*'}/me`)
  }

  getUpgradeStateForCapability(capability, realm, path) {
    return this.getRole(realm, path).then(response => {
      const role = response.body
      const hasCapability = role.capabilities.indexOf(capability) > -1

      if (!hasCapability && !role.upgrades[capability]) {
        throw new Error(`No upgrade path for capability ${JSON.stringify(capability)}. This is most likely because the capability is invalid.`)
      }
      return {
        role: role,
        hasCapability: hasCapability,
        nextUpgrade: role.upgrades[capability] && role.upgrades[capability][0],
        // note: we don't know the entire upgrade path.
        // i.e the user may not be logged in and only after login we may know the missing upgrades
        knownUpgrades: role.upgrades[capability]
      }
    })
  }
}
