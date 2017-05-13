'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');

// A Service is simply a context free descriptor of a web service
module.exports = function () {
  function Service(name, version, opts) {
    _classCallCheck(this, Service);

    this.name = name;
    this.version = version;
  }

  _createClass(Service, [{
    key: 'pathTo',
    value: function pathTo(endpoint) {
      return path.join('/', 'api', this.name, 'v' + this.version, endpoint);
    }
  }]);

  return Service;
}();