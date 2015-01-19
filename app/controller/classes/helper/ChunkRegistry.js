var util = require("util");

var Registry = require('../../../common/base/Registry');

var ChunkRegistry = Registry.extend({
  logName: 'node-map-reduce:controller:ChunkRegistry',

  tidy: function() {
    this.log('tidy() called.')

    // TODO: make more efficient
    this.getAll().forEach(function(mapper) {
      if (mapper.canDelete()) {
        this.remove(mapper.id());
      }
    }.bind(this));
  }
});

module.exports = ChunkRegistry;
