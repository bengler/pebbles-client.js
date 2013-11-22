var slice = [].slice;

module.exports = Resource;

function property(prop) {
  return function(item) {
    return item[prop];
  }
}

function Resource(root, opts) {
  if (!opts) throw Error("No options given");
  if (!opts.connector) throw Error("No connector given");
  this.namespace = opts.namespace || {};
  this.connector = opts.connector;
  this._delimiter = opts.delimiter || '/';
  this.root = root;
}

Resource.prototype.unwrap = function(payload) {

  var hasOne = payload.hasOwnProperty(this.namespace.one);
  var hasMany = payload.hasOwnProperty(this.namespace.many);

  if (hasOne && hasMany) {
    throw new Error("Got a response that has both `"+this.namespace.one+"` and `"+this.namespace.many+"`. Don't know which property to use:", payload)
  }
  if (hasOne) return payload[this.namespace.one];
  if (hasMany) return payload[this.namespace.many].map(property(this.namespace.one));
  throw new Error("This resource is namespaced, but got a response that has neither `"+this.namespace.one+"` or `"+this.namespace.many+"`:", payload)
};

Resource.prototype.get = function get(id, params, opts, cb) {
  return this.request.apply(this, ['get', [this.root, id].join(this._delimiter)].concat(slice.call(arguments, 1)));
};

Resource.prototype.post = function post(params, opts, cb) {
  if (this.namespace.one) params[this.namespace.one] = params;
  return this.request.apply(this, ['post', this.root].concat(slice.call(arguments)));
};

Resource.prototype.del = function del(id, params, opts, cb) {
  return this.request.apply(this, ['del', [this.root, id].join(this._delimiter)].concat(slice.call(arguments, 1)));
};

Resource.prototype.put = function put(id, params, opts, cb) {
  if (this.namespace.one) params[this.namespace.one] = params;
  return this.request.apply(this, ['put', [this.root, id].join(this._delimiter)].concat(slice.call(arguments, 1)));
};

Resource.prototype.index = function index(params, opts, cb) {
  return this.request.apply(this, ['get', this.root].concat(slice.call(arguments)));
};
// Aliases
Resource.prototype.find = Resource.prototype.index;
Resource.prototype.all = Resource.prototype.index;
Resource.prototype.list = Resource.prototype.index;
Resource.prototype.collection = Resource.prototype.index;

Resource.prototype.save = function request(params, opts, cb) {
  // Todo: need the ability to define an id field on items
};

function wrap(cb, ctx) {
  return function(err, response, body) {
    if (err) return cb(err, response, body);
    try {
      var unwrapped = ctx.unwrap(body);
    }
    catch (e) {
      cb(e, body, response)
    }
    return cb(null, unwrapped, response);
  }
}

Resource.prototype.request = function request(method, path, params, opts, cb) {
  var args = slice.call(arguments);

  var cbIndex = -1;
  args.some(function(arg, i) {
    if (typeof arg === 'function') {
      cbIndex = i;
      return true;
    }
  });
  if (~cbIndex) {
    args[cbIndex] = wrap(args[cbIndex], this);
  }
  this.connector.request.apply(this.connector, args);
};
