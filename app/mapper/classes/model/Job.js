var log = require('debug')('node-map-reduce:mapper:Job');

var Job = function(
    id,
    mapFunction,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.client_ = client;
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      options: {
        mapFunction: this.mapFunction_
      }
    };
  },

  process: function(chunkId, chunkData) {
    log('process(%s, \"%s\") called', chunkId, chunkData.length > 10 ? chunkData.substr(0, 10) + '...' : chunkData);
    // TODO: process
    log('Processed chunk [%s]. Memory state: [%s/%s]', chunkId, process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);
    process.nextTick(function() {
      this.client_.chunkProcessed(this.id_, chunkId);
    }.bind(this));
  }
};

module.exports = Job;
