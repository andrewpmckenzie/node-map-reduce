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
  this.finished_ = false;

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

  process: function(key, values, partitionerClient) {
    log('process(%s, %o) called', key, values);

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
      log('ERROR Bad kv caught: [k] %s, [v] %o, [memo] %o', key, values, memo);
      log('ERROR %s', wrappedFunction);
      log('ERROR throws %s', errorMessage);
    }

    log('Processed chunks %s: %o', key, result);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    var error = didError ? errorMessage || 'unknown error' : undefined;
    partitionerClient.reduced(this.id_, key, error);

    if (!didError) {
      this.results_[key] = result;
    }
  },

  results: function() {
    return this.results_;
  },

  finish: function() {
    // TODO: verify we're not still processing anything
    // (this works at the moment because we only process 1 job at a time)
    log('Finished job %s.', this.id_);
    this.finished_ = true;
    this.client_.finished(this.id_);
  }
};

module.exports = Job;
