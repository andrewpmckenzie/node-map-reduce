var stringHash = require('string-hash');
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

  this.reducerClients_.forEach(this.decorateReducer_.bind(this));
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_
    };
  },

  decorateReducer_: function(reducer) {
    reducer.on('reduced', function(options) {
      this.chunkKeyProcessed(options.chunkId, options.key, options.error);
    }.bind(this));
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

    // TODO: if reducer queue is growing too large, send andon signal to controller until it abates
    keys.forEach(function(key) {
      var reducer = stringHash(key) % this.reducerClients_.length;
      this.reducerClients_[reducer].reduce(this.id_, chunkId, key, mappedChunk[key]);
    }.bind(this));
  },

  chunkKeyProcessed: function(chunkId, key, error) {
    log('chunkKeyProcessed(%s, %s) called.', chunkId, key);
    var chunk = this.outstandingChunks_[chunkId];

    if (!chunk) {
      log('Could not find chunk %s to mark key %s as complete.', chunkId, key);
      return;
    }

    this.outstandingChunks_[chunkId] = chunk.filter(function(k) { return k !== key; });

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
  },

  chunkProcessed_: function(chunkId, errors) {
    this.controllerClient_.chunkProcessed(this.id_, chunkId, errors);
  }
};

module.exports = Job;
