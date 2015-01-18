var log = require('debug')('node-map-reduce:mapper:Job');
var ControllerJobClient = require('../client/ControllerJobClient');

var Job = function(
    id,
    mapFunction,
    url
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.url_ = url || (function() { throw new Error('url not provided'); })();
  this.client_ = new ControllerJobClient(this.url_);
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      url: this.url_,
      options: {
        mapFunction: this.mapFunction_
      }
    };
  },

  process: function(chunkId, chunkData) {
    log('Processing chunk [' + chunkId + ']: ' + chunkData);
    // TODO: process
    log('Processed chunk [' + chunkId + ']. Memory state: [' + process.memoryUsage().heapUsed + '/' + process.memoryUsage().heapTotal + ']');
    process.nextTick(function() {
      this.client_.chunkDone(chunkId);
    }.bind(this));
  }
};

module.exports = Job;
