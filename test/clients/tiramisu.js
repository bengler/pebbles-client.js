/* eslint-disable max-nested-callbacks */

const assert = require('assert')
const TiramisuClient = require('../../src/clients/tiramisu')
const Connector = require('../../src/connector')
const through = require('through2')
const concat = require('concat-stream')

function step(status, percent, metadata) {
  const ret = {status: status, percent: percent}
  if (metadata) {
    ret.metadata = metadata
  }
  return ret
}

function createProgress() {
  const url = 'http://staging.o5.no.s3.amazonaws.com/oma/www/20150729093106-ucoz-1315-gif/234.gif'
  const aspect = 1.3146

  return [
    ['initializing', 1, {type: 'image', previewUrl: url}],
    ['uploading', 10],
    ['uploading', 20],
    ['uploading', 30],
    ['uploading', 40],
    ['received', 40],
    ['transferring', 50],
    ['transferring', 60],
    ['transferring', 70],
    ['transferring', 80],
    ['transferred', 85],
    ['completed', 100, {
      type: 'image',
      original: 'http://staging.o5.no.s3.amazonaws.com/oma/www/20150729093106-ucoz-1315-gif/original.gif',
      fullsize: 'http://staging.o5.no.s3.amazonaws.com/oma/www/20150729093106-ucoz-1315-gif/1213.gif',
      aspectRatio: aspect,
      tiramisuId: 'image:oma.www$20150520212659-8fqm-1468-jpg',
      versions: [
        {
          width: 100,
          square: false,
          url: `${url}?width=100`
        },
        {
          width: 100,
          square: true,
          url: `${url}?width=100&square=true`
        },
        {
          width: 300,
          square: false,
          url: `${url}?width=300`
        },
        {
          width: 1213,
          square: false,
          url: `${url}?width=1213`
        }
      ]
    }]
  ]
}

const PROGRESS = createProgress()

const noop = function () {
}

// Create a mock XMLHttpRequest
global.XMLHttpRequest = function () {
  const req = {}
  req.open = function (method, url) {
    //console.log("Request: %s %s", method, url)
  }
  req.send = function () {
    req.status = 200
    setTimeout(req.onload, 0)
  }
  return req
}


describe('TiramisuClient', () => {

  const connector = new Connector({adapter: {stream: noop}})

  const client = new TiramisuClient({connector: connector, service: {name: 'tiramisu'}})

  describe('#waitFor', () => {
    xit('progressively polls for versions up to the size of the version specified by the given matchFn', done => {

    })

    it('Waits for a version match specified by the given matchFn', done => {
      const uploadProgress = through.obj()

      uploadProgress
        .pipe(client.waitFor(version => {
          return version.width >= 100
        }))
        .pipe(TiramisuClient.normalizeProgress())
        .pipe(concat(result => {
          const lastReadyVersion = result.slice(-2)[0]
          assert.equal(lastReadyVersion.status, 'ready', 'Unexpected status of second last progress event')
          assert.equal(lastReadyVersion.version.width, 100, 'Unexpected width of last ready image')
          done()
        }))

      PROGRESS.forEach(p => {
        uploadProgress.push(step(...p))
      })

      uploadProgress.end()
    })

    it('Falls back to the largest possible image if there are no version match', done => {
      const uploadProgress = through.obj()

      uploadProgress
        .pipe(client.waitFor(version => {
          return version.width > 1300
        }))
        .pipe(TiramisuClient.normalizeProgress())
        .pipe(concat(result => {
          const lastReadyVersion = result.slice(-2)[0]
          assert.equal(lastReadyVersion.status, 'ready', 'Unexpected status of second last progress event')
          assert.equal(lastReadyVersion.version.width, 1213, 'Unexpected width of last ready image')
          done()
        }))

      PROGRESS.forEach(p => {
        uploadProgress.push(step(...p))
      })

      uploadProgress.end()
    })
  })
})
