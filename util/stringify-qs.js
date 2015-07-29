
var toString = Object.prototype.toString;

module.exports = stringify;

function stringify(obj, prefix) {
  if (Array.isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if (toString.call(obj) == '[object Object]') {
    return stringifyObject(obj, prefix);
  } else if (typeof obj == 'string') {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
}

function stringifyString(str, prefix) {
  if (!prefix) {
    throw new TypeError('stringify expects an object');
  }
  return prefix + '=' + encodeURIComponent(str);
}

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) {
    throw new TypeError('stringify expects an object');
  }
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}


function stringifyObject(obj, prefix) {
  var ret = []
    , keys = Object.keys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if (key == '') {
      continue;
    }
    if (obj[key] == null) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}
