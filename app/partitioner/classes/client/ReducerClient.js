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

    this.socket().on('job:kv:reduced', this.handleReducedChunkKey_.bind(this));
  },

  reduce: function(jobId, chunkId, key, values) {
    this.log('reduce(%s, %s, %s, %o) called.', jobId, chunkId, key, values);
    if (!this.queue_[key]) {
      this.queue_[key] = {chunkIds: [], values: []};
    }
    this.queue_[key].chunkIds.push(chunkId);

    // If the value is an array, merge it with others of the same key
    if (values instanceof Array) {
      this.queue_[key].values = this.queue_[key].values.concat(values);
    } else {
      this.queue_[key].values.push(values);
    }

    this.maybeSendNext_();
  },

  tasksQueued: function() { return this.queue_.length; },

  maybeSendNext_: function() {
    var keys = Object.keys(this.queue_);
    if (this.numberProcessing_ < MAX_PROCESSING && keys.length > 0) {
      // TODO: choose key with most items
      var key = keys[Math.random() & keys.length | 0];
      var valuesAndChunkIds = this.queue_[key];
      delete this.queue_[key];

      this.send('job:kv:process',{
        jobId: this.jobId_,
        key: key,
        chunkIds: valuesAndChunkIds.chunkIds,
        values: valuesAndChunkIds.values
      });
      this.numberProcessing_++;
    }
  },

  handleReducedChunkKey_: function(options) {
    this.log('handleReducedChunkKey_(%o) called.', options);
    var chunkIds = options.chunkIds;
    var key = options.key;
    var errors = options.error;

    chunkIds.forEach(function(chunkId) {
      // TODO: include values, as multiple chunks may be lumped together
      this.emit('reduced', {chunkId: chunkId, key: key, error: errors});
    }.bind(this));

    this.numberProcessing_--;
    this.maybeSendNext_();
  }

});

module.exports = ReducerClient;
