var util = require('util');

var Client = require('../../../common/base/Client');

var MAX_PROCESSING = 5;

var ReducerClient = Client.extend({
  logName: 'nmr:partitioner:ReducerClient',

  constructor: function() {
    ReducerClient.super_.apply(this, arguments);

    this.queue_ = [];
    this.numberProcessing_ = 0;

    this.socket().on('job:kv:reduced', this.handleReducedChunkKey_.bind(this));
  },

  reduce: function(jobId, chunkId, key, values) {
    this.queue_.push({jobId: jobId, chunkId: chunkId, key: key, values: values});
    this.maybeSendNext_();
  },

  maybeSendNext_: function() {
    if (this.numberProcessing_ < MAX_PROCESSING && this.queue_.length > 0) {
      this.send('job:kv:process', this.queue_.pop());
      this.numberProcessing_++;
    }
  },

  handleReducedChunkKey_: function(options) {
    this.log('handleReducedChunkKey_(%o) called.', options);
    var chunkId = options.chunkId;
    var key = options.key;
    var errors = options.error;

    this.emit('reduced', {chunkId: chunkId, key: key, error: errors});

    this.numberProcessing_--;
    this.maybeSendNext_();
  }

});

module.exports = ReducerClient;
