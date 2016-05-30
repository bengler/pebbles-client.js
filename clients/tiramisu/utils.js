var through = require('through');

exports.filter = function filter(test) {
  return through(function (chunk) {
    if (test(chunk)) {
      this.queue(chunk);
    }
  });
}

exports.parseJSON = function parseJSON() {
  return through(function (jsonStr) {
    var parsed;
    var didParse = false;
    try {
      parsed = JSON.parse(jsonStr);
      didParse = true;
    }
    catch(e) {
      this.emit('error', new Error('Unparseable JSON string: ' + JSON.stringify(jsonStr) + ', ' + e.message))
    }
    if (didParse) {
      this.queue(parsed);
    }
  });
}
