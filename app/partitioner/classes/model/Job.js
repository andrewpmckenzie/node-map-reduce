var log = require('debug')('nmr:partitioner:Job');

var Job = function(
    id,
    controllerClient
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.controllerClient_ = controllerClient;
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_
    };
  },

  process: function(chunkId, mappedChunk) {
    log('process(%s, %o) called.', chunkId, mappedChunk);

    var errorMessage = null;
    this.controllerClient_.chunkProcessed(this.id_, chunkId, errorMessage);
  }
};

module.exports = Job;
