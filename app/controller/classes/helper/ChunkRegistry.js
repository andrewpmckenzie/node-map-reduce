var util = require("util");
var log = require('debug')('node-map-reduce:controller:ChunkRegistry');

var Registry = require('../../../common/base/Registry');

var ChunkRegistry = Registry.extend({
  tidy: function() {

    // TODO: make more efficient
    this.getAll().forEach(function(mapper) {
      if (mapper.canDelete()) {
        this.remove(mapper.id());
      }
    }.bind(this));
  }
});

module.exports = ChunkRegistry;
