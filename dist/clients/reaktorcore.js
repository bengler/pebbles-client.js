'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Client = require('../../client');

module.exports = function (_Client) {
  _inherits(ReaktorCoreClient, _Client);

  function ReaktorCoreClient() {
    _classCallCheck(this, ReaktorCoreClient);

    return _possibleConstructorReturn(this, (ReaktorCoreClient.__proto__ || Object.getPrototypeOf(ReaktorCoreClient)).apply(this, arguments));
  }

  _createClass(ReaktorCoreClient, [{
    key: 'getRole',
    value: function getRole(realm, path) {
      return this.get('/roles/' + realm + '/' + (path || '*') + '/me');
    }
  }, {
    key: 'getUpgradeStateForCapability',
    value: function getUpgradeStateForCapability(capability, realm, path) {
      return this.getRole(realm, path).then(function (response) {
        var role = response.body;
        var hasCapability = role.capabilities.indexOf(capability) > -1;

        if (!hasCapability && !role.upgrades[capability]) {
          throw new Error('No upgrade path for capability ' + JSON.stringify(capability) + '. This is most likely because the capability is invalid.');
        }
        return {
          role: role,
          hasCapability: hasCapability,
          nextUpgrade: role.upgrades[capability] && role.upgrades[capability][0],
          // note: we don't know the entire upgrade path.
          // i.e the user may not be logged in and only after login we may know the missing upgrades
          knownUpgrades: role.upgrades[capability]
        };
      });
    }
  }]);

  return ReaktorCoreClient;
}(Client);