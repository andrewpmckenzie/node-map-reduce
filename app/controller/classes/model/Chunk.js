var log = require('debug')('nmr:controller:Chunk');

var Chunk = function(id, rawChunk) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();

  // kept during the map stage JIC we want to recover from failed mapper
  this.rawChunk_ = rawChunk;

  this.mapper_ = null;
  this.isDone_ = false;

  this.errorPhase_ = null;
  this.error_ = null;
};

Chunk.prototype = {
  id: function () { return this.id_; },

  error: function() {
    if (!this.errorPhase_) {
      return null;
    }

    return {
      phase: this.errorPhase_,
      error: this.error_,
      mapper: this.mapper_.id(),
      chunk: this.rawChunk_
    };
  },

  toJson: function () {
    return {
      id: this.id_,
      error: this.error()
    }
  },

  canDelete: function() {
    return this.isDone_;
  },

  setMapping: function(mapper) {
    this.mapper_ = mapper;
  },

  setReducing: function() {
    this.rawChunk_ = null;
    this.markMapperDone_();
    this.mapper_ = null;
  },

  setDone: function() {
    this.rawChunk_ = null;
    this.isDone_ = true;
    this.markMapperDone_();
    this.mapper_ = null;
  },

  setError: function(phase, error) {
    this.errorPhase_ = phase;
    this.error_ = error;
    this.isDone_ = true;
    this.markMapperDone_();
  },

  markMapperDone_: function() {
    if (this.mapper_) {
      this.mapper_.becameAvailable();
    }
  }
};

module.exports = Chunk;
