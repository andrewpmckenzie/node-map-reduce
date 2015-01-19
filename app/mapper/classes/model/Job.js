// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');

// http://gf3.github.io/sandbox/
var Sandbox = require('sandbox');

var log = require('debug')('node-map-reduce:mapper:Job');

var Job = function(
    id,
    mapFunction,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.client_ = client;
  this.sandbox_ = new Sandbox({
    timeout: 1000 // TODO: make this configurable
  });
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      options: {
        mapFunction: this.mapFunction_
      }
    };
  },

  process: function(chunkId, chunkData) {
    log('process(%s, \"%s\") called', chunkId, chunkData.length > 10 ? chunkData.substr(0, 10) + '...' : chunkData);
    var escapedData = jsesc(chunkData);
    var wrappedFunction = 'JSON.stringify((' + this.mapFunction_ + ')(\'' + escapedData + '\'))';
    this.sandbox_.run(wrappedFunction, function(output) {
      var consoleOutput = output.console;
      var rawResult = output.result;
      var errorMessage = null;

      try {
        var result = JSON.parse(rawResult.replace(/^'/, '').replace(/'$/, ''));
      } catch(e) {
        errorMessage = rawResult;
        log('ERROR Bad chunk caught: %s', chunkData);
        log('ERROR %s', wrappedFunction);
        log('ERROR throws %s', errorMessage);
      }

      log('Processed chunk [%s]: %o', chunkId, result);
      (consoleOutput || []).forEach(function(consoleMessage) { log('  > %s', consoleMessage); });
      log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

      this.client_.chunkProcessed(this.id_, chunkId, errorMessage);
    }.bind(this));
  }
};

module.exports = Job;
