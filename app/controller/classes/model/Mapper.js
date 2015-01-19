var MapperClient = require('../client/MapperClient');
var log = require('debug')('node-map-reduce:controller:Mapper');

var Mapper = function(id, socket, address) {
  this.id_ = id;
  this.isAvailable_ = true;
  this.client_ = new MapperClient(socket);
  this.address_ = address;

  log('Mapper %s created.', id);
};

Mapper.prototype = {
  id: function() { return this.id_; },

  url: function() { return this.url_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() {
    log('Mapper %s became available.', this.url_);
    this.isAvailable_ = true;
  },

  toJson: function() {
    return {
      id: this.id_,
      isAvailable_: this.isAvailable_
    }
  },

  process: function(jobId, chunkId, rawChunk) {
    this.isAvailable_ = false;
    this.client_.process.apply(this.client_, arguments);
  },

  deleteJob: function(jobId) {
    this.client_.deleteJob.apply(this.client_, arguments);
  },

  registerJob: function(jobId, mapFunction, onSuccess, onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

};

module.exports = Mapper;
