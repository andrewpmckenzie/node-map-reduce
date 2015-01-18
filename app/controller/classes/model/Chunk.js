var log = require('debug')('node-map-reduce:controller:Chunk');

var Chunk = function(id, rawChunk) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();

  // kept during the map stage JIC we want to recover from failed mapper
  this.rawChunk_ = id ||  (function() { throw new Error('rawChunk not provided'); })();

  this.mapper_ = null;
  this.reductionKeys_ = null;
  this.isDone_ = false;
};

Chunk.prototype = {
  id: function () { return this.id_; },

  toJson: function () {
    return {
      id: this.id_,
      status: this.status_
    }
  },

  getStatus: function() {
    if (this.mapper_) {
      return Chunk.Status.MAPPING;
    } else if (this.reductionKeys_) {
      return Chunk.Status.REDUCING;
    } else {
      return Chunk.Status.DONE;
    }
  },

  canDelete: function() {
    return this.isDone_;
  },

  setMapping: function(mapper) {
    this.mapper_ = mapper;
  },

  setReducing: function(keys) {
    this.markMapperDone_();
    this.rawChunk_ = null;
    this.reductionKeys_ = keys;
  },

  setDone: function() {
    this.markMapperDone_();
    this.rawChunk_ = null;
    this.reductionKeys_ = null;
    this.isDone_ = true;
  },

  markMapperDone_: function() {
    if (this.mapper_) {
      this.mapper_.becameAvailable();
      this.mapper_ = null;
    }
  }
};

Chunk.Status = {
  MAPPING: 'MAPPING',
  REDUCING: 'REDUCING',
  DONE: 'DONE'
};

module.exports = Chunk;
