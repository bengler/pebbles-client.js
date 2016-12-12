

const toString = Object.prototype.toString

module.exports = stringify

function stringify(obj, prefix) {
  if (Array.isArray(obj)) {
    return stringifyArray(obj, prefix)
  } else if (toString.call(obj) == '[object Object]') {
    return stringifyObject(obj, prefix)
  } else if (typeof obj == 'string') {
    return stringifyString(obj, prefix)
  }
  return `${prefix}=${encodeURIComponent(String(obj))}`
}

function stringifyString(str, prefix) {
  if (!prefix) {
    throw new TypeError('stringify expects an object')
  }
  return `${prefix}=${encodeURIComponent(str)}`
}

function stringifyArray(arr, prefix) {
  const ret = []
  if (!prefix) {
    throw new TypeError('stringify expects an object')
  }
  for (let i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], `${prefix}[]`))
  }
  return ret.join('&')
}


function stringifyObject(obj, prefix) {
  const ret = []
  const keys = Object.keys(obj)
  let key

  for (let i = 0, len = keys.length; i < len; ++i) {
    key = keys[i]
    if (key == '') {
      continue
    }
    if (obj[key] === null) {
      ret.push(`${encodeURIComponent(key)}=`)
    } else {
      ret.push(stringify(obj[key], prefix
        ? `${prefix}[${encodeURIComponent(key)}]`
        : encodeURIComponent(key)))
    }
  }

  return ret.join('&')
}
