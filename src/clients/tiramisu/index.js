const Client = require('../../client')
const through = require('through2')
const extend = require('xtend')
const split = require('split2')
const pumpify = require('pumpify')

const {normalizeProgress, parseJSON, checkError, waitForVersion, filter} = require('./utils')

class TiramisuClient extends Client {
  uploadImage(endpoint, file, options) {
    const uploadOpts = {}
    if (options && options.forceJPEG === false) {
      uploadOpts.queryString = {force_jpeg: false} // eslint-disable-line camelcase
    }
    return pumpify.obj(
      this.upload(endpoint, file, uploadOpts),
      this.waitFor(options.waitFor),
      normalizeProgress()
    )
  }

  uploadFile(endpoint, file, options) {
    return pumpify.obj(
      this.upload(endpoint, file, options),
      normalizeProgress()
    )
  }

  upload(endpoint, file, options) {

    const formData = new window.FormData()
    formData.append('file', file)

    const req = this.stream().post(endpoint, null, options)

    req.xhr.upload.addEventListener('progress', progressEvent => {
      const percent = progressEvent.lengthComputable ? Math.ceil((progressEvent.loaded / progressEvent.total) * 100) : -1
      req.push(`{"percent": ${percent},"status": "uploading"}\n`)
    })

    req.end(formData)

    return pumpify.obj(
      req,
      split('\n'),
      filter(line => {
        return line && line.trim().length > 0
      }),
      parseJSON(),
      checkError()
    )
  }

  waitFor(versionMatchFn) {
    let completedEvent
    let pendingVersions
    let waitForCount

    const stream = through.obj(write, end)

    function write(event, enc, cb) {
      if (event.status === 'completed' || event.status === 'failed') {
        completedEvent = event
      }
      this.push(event)
      cb()
    }

    function end(cb) {
      // Rename the 'completed' event to 'transferred' as it is not completed just yet :)
      this.push(extend(completedEvent, {status: 'transferred'}))

      pendingVersions = completedEvent.metadata.versions.slice()
      if (versionMatchFn) {
        const matchingVersionIndex = pendingVersions.findIndex(versionMatchFn)
        if (matchingVersionIndex > -1) {
          pendingVersions = pendingVersions.slice(0, matchingVersionIndex + 1)
        }
      }
      waitForCount = pendingVersions.length

      pollNext().then(readyVersion => {
        this.push({status: 'completed', ready: readyVersion, metadata: completedEvent.metadata, percent: 100})
        cb()
      })
    }

    function pollNext() {
      return waitForVersion(pendingVersions.shift())
        .then(readyVersion => {
          const percent = 100 / waitForCount * (waitForCount - pendingVersions.length)

          stream.push({status: 'ready', version: readyVersion, metadata: completedEvent.metadata, percent: percent})

          if (pendingVersions.length == 0) {
            return readyVersion
          }
          return pollNext()
        })
    }

    return stream
  }
}

TiramisuClient.normalizeProgress = normalizeProgress

module.exports = TiramisuClient
