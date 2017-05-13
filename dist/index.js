'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var extend = require('xtend');
var Connector = require('./connector');

var adapter = require('./adapters/node-http');

var NodeConnector = function (_Connector) {
  _inherits(NodeConnector, _Connector);

  function NodeConnector(options) {
    _classCallCheck(this, NodeConnector);

    return _possibleConstructorReturn(this, (NodeConnector.__proto__ || Object.getPrototypeOf(NodeConnector)).call(this, extend(options, { adapter: adapter })));
  }

  return NodeConnector;
}(Connector);

module.exports = {
  Service: require('./service'),
  Client: require('./client'),
  Connector: NodeConnector
};