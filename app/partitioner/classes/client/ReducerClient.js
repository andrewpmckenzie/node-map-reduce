var util = require('util');

var Client = require('../../../common/base/Client');

var MAX_PROCESSING = 10;

var ReducerClient = Client.extend({
  logName: 'nmr:partitioner:ReducerClient',

  constructor: function(address, jobId) {
    ReducerClient.super_.call(this, address);

    this.queue_ = {};
    this.numberProcessing_ = 0;
    this.jobId_ = jobId;
    this.finished_ = false;

    this.socket().on('job:kv:reduced', this.handleReducedChunkKey_.bind(this));
  },

  reduce: function(jobId, key, values) {
    this.log('reduce(%s, %s, %o) called.', jobId, key, values);
    if (!this.queue_[key]) {
      this.queue_[key] = [];
    }

    // If the value is an array, merge it with others of the same key
    if (values instanceof Array) {
      this.queue_[key] = this.queue_[key].concat(values);
    } else {
      this.queue_[key].push(values);
    }

    this.maybeSendNext_();
  },

  finish: function() {
    this.finished_ = true;
    this.maybeSignalFinished_();
  },

  tasksQueued: function() { return Object.keys(this.queue_).length; },

  maybeSendNext_: function() {
    var keys = Object.keys(this.queue_);
    if (this.numberProcessing_ < MAX_PROCESSING && keys.length > 0) {
      // TODO: choose key with most items
      var key = keys[Math.random() & keys.length | 0];
      var values = this.queue_[key];
      delete this.queue_[key];

      this.send('job:kv:process',{
        jobId: this.jobId_,
        key: key,
        values: values
      });
      this.numberProcessing_++;
    }
  },

  maybeSignalFinished_: function() {
    if (this.finished_) {
      this.log('maybeSignalFinished_() called.');

      if (this.numberProcessing_ === 0) {
        this.log('Telling reducer there is nothing left to do.');
        this.send('job:finish', {jobId: this.jobId_});
      } else {
        this.log('Waiting on %s keys to be processed.', this.numberProcessing_);
      }
    }
  },

  handleReducedChunkKey_: function(options) {
    this.log('handleReducedChunkKey_(%o) called.', options);

    this.numberProcessing_--;
    this.maybeSendNext_();
    this.maybeSignalFinished_();
  }

});

module.exports = ReducerClient;
