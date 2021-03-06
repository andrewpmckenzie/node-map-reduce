var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var PartitionerClient = require('../client/PartitionerClient');
var log = require('debug')('nmr:common:Partitioner');

var Partitioner = function(id, socket, address) {
  this.id_ = id;
  this.isAvailable_ = true;
  this.client_ = new PartitionerClient(socket);
  this.address_ = address;

  this.finishedJobs_ = {};

  log('Partitioner %s created.', id);
};

util.inherits(Partitioner, EventEmitter);

Partitioner.prototype = _.assign(Partitioner.prototype, {
  id: function() { return this.id_; },

  address: function() { return this.address_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() {
    log('Partitioner %s became available.', this.id_);
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

  registerJob: function(jobId, reducerAddresses, mapperCount, onSuccess, onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

});

module.exports = Partitioner;
