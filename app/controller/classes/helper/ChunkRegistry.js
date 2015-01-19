var util = require("util");

var Registry = require('../../../common/base/Registry');

var ChunkRegistry = Registry.extend({
  logName: 'node-map-reduce:controller:ChunkRegistry',

  constructor: function() {
    ChunkRegistry.super_.call(this, arguments);

    this.erroringChunks_ = [];
  },

  tidy: function() {
    this.log('tidy() called.');

    // TODO: make more efficient
    this.getAll().forEach(function(chunk) {
      if (chunk.canDelete()) {
        this.remove(chunk.id());
      }

      if (chunk.error()) {
        this.log('Chunk [%s] errored. Removing.', chunk.id());
        this.erroringChunks_.push(chunk);
      }
    }.bind(this));
  },

  erroringChunks: function() { return this.erroringChunks_; }
});

module.exports = ChunkRegistry;
