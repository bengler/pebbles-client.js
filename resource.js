"use strict";

var slice = [].slice;

module.exports = Resource;

function property(prop) {
  return function (item) {
    return item[prop];
  };
}

function unwrapCollection(ns) {
  return function (items) {
      return items[ns.many].map(property(ns.one));
  };
}

function Resource(root, opts) {
  if (!opts) throw new Error("No options given");
  if (!opts.client) throw new Error("No client given");
  this.namespace = opts.namespace || {};
  this.client = opts.client;
  this._delimiter = opts.delimiter || '/';
  this.root = root;
}
function withCallback(options, args, unwrapper) {
  var cb = args[args.length - 1];
  if (typeof cb === 'function') {
    return [options, function (err, body, response) {
      cb(err, unwrapper(body), response);
    }]
  }
  return [options];
}

function namespace(object, namespace) {
  var o = {};
  o[namespace] = object;
  return o;
}

Resource.prototype._request = function index(options, cb) {
  this.client.request.apply(this.client, arguments)
}

Resource.prototype.index = function index(queryString, opts, cb) {
  var options = {
    method: 'get',
    endpoint: this.root
  };
  if (typeof arguments[0] === 'object' || typeof arguments[0] === 'string') {
    options.queryString = arguments[0];
  }
  if (typeof arguments[1] === 'object') {
    extend(options, opts);
  }
  this._request.apply(this, withCallback(options, arguments, this.namespace.many ? unwrapCollection(this.namespace) : null));
};

// Aliases
Resource.prototype.find = Resource.prototype.index;
Resource.prototype.all = Resource.prototype.index;
Resource.prototype.list = Resource.prototype.index;
Resource.prototype.collection = Resource.prototype.index;

Resource.prototype.get = function get(id, queryString, opts, callback) {
  var options = {
    method: 'get',
    endpoint: [this.root, id].join(this._delimiter)
  };
  if (typeof arguments[1] === 'object') {
    options.queryString = arguments[1];
  }
  if (typeof arguments[2] === 'object') {
    extend(options, opts);
  }
  this._request.apply(this, withCallback(options, arguments, this.namespace.one ? property(this.namespace.one) : null));
};

Resource.prototype.del = function del(id, queryString, opts, callback) {
  var options = {
    method: 'delete',
    endpoint: [this.root, id].join(this._delimiter)
  };
  if (typeof arguments[1] === 'object') {
    options.queryString = arguments[1];
  }
  if (typeof arguments[2] === 'object') {
    extend(options, opts);
  }
  return this._request.apply(this, withCallback(options, arguments, this.namespace.one ? property(this.namespace.one) : null));
};

Resource.prototype.post = function post(body, opts, callback) {
  var options = {
    method: 'post',
    endpoint: this.root,
    body: this.namespace.one ? namespace(body, this.namespace.one) : body
  };
  if (opts && typeof(opts) === 'object') {
    extend(options, opts);
  }
  return this._request.apply(this, withCallback(options, arguments, this.namespace.one ? property(this.namespace.one) : null));
};

Resource.prototype.create = Resource.prototype.post;

Resource.prototype.put = function put(id, params, opts, cb) {
  this.namespace.one && (body = body[this.namespace.one]);
  var options = {
    method: 'put',
    endpoint: this.root,
    body: this.namespace.one ? namespace(body, this.namespace.one) : body
  };
  if (opts && isObject(opts)) {
    extend(options, opts);
  }
  this._request.apply(this, withCallback(options, arguments, this.namespace.one ? property(this.namespace.one) : null));
};

Resource.prototype.save = Resource.prototype.put;

