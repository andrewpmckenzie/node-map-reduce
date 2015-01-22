// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');

// http://gf3.github.io/sandbox/
var Sandbox = require('sandbox');

var log = require('debug')('nmr:reducer:Job');

var Job = function(
    id,
    reduceFunction,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.client_ = client;

  // TODO: find an alternative to Sandbox. It is sssslllllooooooowwwwwwwwww.
  this.sandbox_ = new Sandbox({
    timeout: 1000 // TODO: make this configurable
  });

  this.results_ = {};
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      options: {
        reduceFunction: this.reduceFunction_
      }
    };
  },

  process: function(chunkId, key, values, partitionerClient) {
    log('process(%s, %s, %o) called', chunkId, key, values);

    var memo = this.results_[key];

    // TODO: how should we handle types?
    var escapedMemo = memo ? jsesc(memo) : '';
    var escapedValues = jsesc(values);

    // TODO: pass through appropriate types
    var wrappedFunction = 'JSON.stringify((' + this.reduceFunction_ + ')(\'' + escapedMemo + '\', \'' + escapedValues + '\'))';

    this.sandbox_.run(wrappedFunction, function(output) {
      var consoleOutput = output.console;
      var rawResult = output.result;
      var errorMessage = null;
      var didError = false;

      try {
        var result = JSON.parse(rawResult.replace(/^'/, '').replace(/'$/, ''));
      } catch(e) {
        errorMessage = rawResult;
        didError = true;
        log('ERROR Bad kv caught: [k] %s, [v] %o, [memo] %o, [chunkId] %s', key, values, memo, chunkId);
        log('ERROR %s', wrappedFunction);
        log('ERROR throws %s', errorMessage);
      }

      log('Processed chunk [%s][%s]: %o', chunkId, key, result);
      (consoleOutput || []).forEach(function(consoleMessage) { log('  > %s', consoleMessage); });
      log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

      var error = didError ? errorMessage || 'unknown error' : undefined;
      partitionerClient.reduced(this.id_, chunkId, key, error);

      this.results_[key] = result;
    }.bind(this));
  },

  results: function() {
    return this.results_;
  }
};

module.exports = Job;
