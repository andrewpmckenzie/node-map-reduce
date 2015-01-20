var log = require('debug')('nmr:partitioner:Job');

var Job = function(
    id,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.controllerClient_ = client;
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_
    };
  }
};

module.exports = Job;
