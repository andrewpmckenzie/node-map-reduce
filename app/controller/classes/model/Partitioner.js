var PartitionerClient = require('../client/PartitionerClient');
var log = require('debug')('node-map-reduce:common:Partitioner');

var Partitioner = function(id, socket) {
  this.id_ = id;
  this.isAvailable_ = true;
  this.client_ = new PartitionerClient(socket);

  log('Partitioner %s created.', id);
};

Partitioner.prototype = {
  id: function() { return this.id_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() {
    log('Partitioner %s became available.', this.url_);
    this.isAvailable_ = true;
  },

  toJson: function() {
    return {
      id: this.id_,
      isAvailable_: this.isAvailable_
    }
  },

  deleteJob: function(jobId) {
    this.client_.deleteJob.apply(this.client_, arguments);
  },

  registerJob: function(jobId, onSuccess, onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

};

module.exports = Partitioner;
