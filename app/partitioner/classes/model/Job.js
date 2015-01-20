var log = require('debug')('nmr:partitioner:Job');

var Job = function(
    id,
    reducerClients,
    controllerClient
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.reducerClients_ = reducerClients;
  this.controllerClient_ = controllerClient;

  this.outstandingChunks_ = {};
  this.chunkErrors_ = {};

  if (this.reducerClients_.length === 0) {
    log('ERROR: No reducers provided.');
  }
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
    var keys = Object.keys(mappedChunk);

    if (keys.length === 0) {
      log('Chunk %s was empty.', chunkId);
      this.chunkProcessed_(chunkId);
      return;
    }

    this.outstandingChunks_[chunkId] = keys;

    // TEMP
    this.chunkProcessed_(chunkId);
  },

  chunkKeyProcessed: function(chunkId, key, error) {
    log('chunkKeyProcessed(%s, %s) called.', chunkId, key);
    var chunk = this.outstandingChunks_[chunkId];

    if (!chunk) {
      log('Could not find chunk %s to mark key %s as complete.', chunkId, key);
    }

    this.outstandingChunks_[chunkId] = this.outstandingChunks_[chunkId].filter(function(k) { return k !== key; });

    if (error) {
      this.chunkErrors_[chunkId] = this.chunkErrors_[chunkId] || {};
      this.chunkErrors_[chunkId][key] = error;
    }

    if (this.outstandingChunks_[chunkId].length === 0) {

      var errors = null;
      if (this.chunkErrors_[chunkId]) {
        errors = this.chunkErrors_[chunkId];
        delete this.chunkErrors_[chunkId];
      }

      delete this.outstandingChunks_[chunkId];
      this.chunkProcessed_(chunkId, errors);
    }

    // TODO: send to reducer(hash(key))
  },

  chunkProcessed_: function(chunkId, errors) {
    this.controllerClient_.chunkProcessed(this.id_, chunkId, errors);
  }
};

module.exports = Job;
