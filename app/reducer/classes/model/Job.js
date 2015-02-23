// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');
var vm = require('vm');
var log = require('debug')('nmr:reducer:Job');
var _ = require('lodash');
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var JobBase = require('../../../common/model/Job');

var Job = JobBase.extend({

  constructor: function(
    id,
    reduceFunction,
    client
  ) {
    Job.super_.call(this, id);

    this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
    this.client_ = client;
    this.finished_ = false;
    this.reducedCount_ = 0;

    this.results_ = {};
  },

  toJson: function() {
    return _.extend(Job.super_.prototype.toJson.call(this), {
      reduceFunction: this.reduceFunction_,
      results: this.results_
    });
  },

  // Because we're only processing a single mapping at a time
  canFinish: function() { return true; },

  bubbleFinish: function() { this.client_.finished(this.id_); },

  generateStats: function() { return { reduced: this.reducedCount_ }; },

  process: function(key, values, partitionerClient) {
    log('process(%s, %o) called', key, values);

    var memo = this.results_[key];

    // TODO: how should we handle types?
    var escapedMemo = memo ? jsesc(memo) : '';
    var escapedValues = JSON.stringify(values);

    // TODO: pass through appropriate types
    var wrappedFunction = '(' + this.reduceFunction_ + ')(\'' + escapedMemo + '\', ' + escapedValues + ')';

    var result;
    var errorMessage = null;
    var didError = false;

    try {
      result = vm.runInNewContext(wrappedFunction);
    } catch(e) {
      errorMessage = e.message;
      didError = true;
      log('ERROR Bad kv caught: [k] %s, [v] %o, [memo] %o', key, values, memo);
      log('ERROR %s', wrappedFunction);
      log('ERROR throws %s', errorMessage);

      var errObj = {};
      errObj[key] = values;
      this.client_.error(this.id(), errObj, errorMessage);
    }

    log('Processed chunks %s: %o', key, result);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    var error = didError ? errorMessage || 'unknown error' : undefined;
    partitionerClient.reduced(this.id_, key, error);

    if (!didError) {
      this.results_[key] = result;
      this.reducedCount_++;
    }
  },

  results: function() { return this.results_; }
});

module.exports = Job;
