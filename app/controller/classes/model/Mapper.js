var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var MapperClient = require('../client/MapperClient');
var log = require('debug')('nmr:controller:Mapper');

var Mapper = function(id, socket, address) {
  this.id_ = id;
  this.isAvailable_ = true;
  this.client_ = new MapperClient(socket);
  this.address_ = address;

  this.finishedJobs_ = {};

  log('Mapper %s created.', id);
};

util.inherits(Mapper, EventEmitter);

Mapper.prototype = _.assign(Mapper.prototype, {
  id: function() { return this.id_; },

  address: function() { return this.address_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() {
    log('Mapper %s became available.', this.id_);
    this.isAvailable_ = true;
    this.emit('available');
  },

  toJson: function() {
    return {
      id: this.id_,
      isAvailable_: this.isAvailable_
    }
  },

  process: function(jobId, rawChunk) {
    this.isAvailable_ = false;
    this.client_.process.apply(this.client_, arguments);
  },

  deleteJob: function(jobId) {
    this.client_.deleteJob.apply(this.client_, arguments);
  },

  finishJob: function(jobId) {
    this.client_.finishJob.apply(this.client_, arguments);
  },

  registerJob: function(jobId, mapFunction, onSuccess, onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

});

module.exports = Mapper;
