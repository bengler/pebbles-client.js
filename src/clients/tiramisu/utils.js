const extend = require('xtend')
const through = require('through2')

// A few util functions

module.exports = {
  filter,
  parseJSON,
  checkError,
  normalizeProgress,
  waitForVersion,
  findIndex
}

function findIndex(array, predicateFn) {
  let foundIndex = -1
  array.some((item, index) => {
    const found = predicateFn(item, index, array)
    if (found) {
      foundIndex = index
    }
    return found
  })
  return foundIndex
}

function filter(test) {
  return through(function (chunk, enc, cb) {
    if (test(String(chunk))) {
      this.push(chunk)
    }
    cb()
  })
}

function parseJSON() {
  return through.obj(function (jsonStr, enc, cb) {
    let parsed
    let error = null
    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      error = e
    }
    if (error) {
      cb(error)
      return
    }
    this.push(parsed)
    cb()
  })
}

function checkError() {
  return through.obj(function write(data, chunk, cb) {
    if (data.status === 'failed') {
      cb(new Error(`Upload failed: ${data.message}`))
      return
    }
    this.push(data)
    cb()
  })
}

const normalizers = {
  initializing: percent => 0,
  uploading: percent => percent * 0.6,
  received: percent => 60,
  transferring: percent => 60 + (percent * 0.2),
  transferred: percent => 80,
  ready: percent => 80 + (percent * 0.2),
  completed: () => 100,
  failed: () => 100
}

function normalizeProgress() {
  return through.obj(function write(event, enc, cb) {
    this.push(extend(event, {
      percent: normalizers[event.status](event.percent)
    }))
    cb()
  })
}


function waitForVersion(version, _opts) {
  const opts = _opts || {}
  opts.timeout = opts.timeout || 1000 * 60 * 5
  opts.pollInterval = opts.pollInterval || 1000

  function poll() {
    return _checkS3(version.url)
      .then(() => version)
      .catch(() => delay(opts.pollInterval).then(poll))
  }
  return timeout(poll(), opts.timeout, `Transcoding timed out after ${opts.timeout}ms`)
}

function _checkS3(url) {
  const req = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    req.open('HEAD', url, true)
    req.onload = function () {
      if (req.status == 403) {
        reject()
      } else {
        resolve()
      }
    }
    req.onerror = reject
    req.send()
  })
}

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function timeout(promise, time, error) {
  return Promise.race([promise, delay(time).then(() => {
    throw new Error(error || 'Operation timed out')
  })])
}
