var MapperClient = require('../client/MapperClient');

var Mapper = function(id, url) {
  this.id_ = id;
  this.url_ = url;
  this.isAvailable_ = true;
  this.client_ = new MapperClient(this.url_);
};

Mapper.prototype = {
  id: function() { return this.id_; },

  url: function() { return this.url_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() { this.isAvailable_ = true; },

  toJson: function() {
    return {
      id: this.id_,
      url: this.url_
    }
  },

  process: function(jobId, chunkId, rawChunk) {
    this.isAvailable_ = false;
    this.client_.process.apply(this.client_, arguments);
  },

  deleteJob: function(jobId) {
    this.client_.deleteJob.apply(this.client_, arguments);
  },

  registerJob: function(jobId, jobUrl, mapFunction, opt_onSuccess, opt_onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

};

module.exports = Mapper;
