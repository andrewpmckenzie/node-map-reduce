// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');

var vm = require('vm');

var log = require('debug')('nmr:reducer:Job');

var Job = function(
    id,
    reduceFunction,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.client_ = client;

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

  process: function(chunkIds, key, values, partitionerClient) {
    log('process(%o, %s, %o) called', chunkIds, key, values);

    var memo = this.results_[key];

    // TODO: how should we handle types?
    var escapedMemo = memo ? jsesc(memo) : '';
    var escapedValues = values.map(jsesc);

    // TODO: pass through appropriate types
    var wrappedFunction = '(' + this.reduceFunction_ + ')(\'' + escapedMemo + '\', [\'' + escapedValues.join('\',\'') + '\'])';

    var result;
    var errorMessage = null;
    var didError = false;

    try {
      result = vm.runInNewContext(wrappedFunction);
    } catch(e) {
      errorMessage = rawResult;
      didError = true;
      log('ERROR Bad kv caught: [k] %s, [v] %o, [memo] %o, [chunkId] %s', key, values, memo, chunkId);
      log('ERROR %s', wrappedFunction);
      log('ERROR throws %s', errorMessage);
    }

    log('Processed chunks %s:%o: %o', key, chunkIds, result);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    var error = didError ? errorMessage || 'unknown error' : undefined;
    partitionerClient.reduced(this.id_, chunkIds, key, error);

    if (!didError) {
      this.results_[key] = result;
    }
  },

  results: function() {
    return this.results_;
  }
};

module.exports = Job;
