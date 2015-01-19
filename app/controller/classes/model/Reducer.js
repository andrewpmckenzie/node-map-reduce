var ReducerClient = require('../client/ReducerClient');
var log = require('debug')('nmr:common:Reducer');

var Reducer = function(id, socket, address) {
  this.id_ = id;
  this.isAvailable_ = true;
  this.client_ = new ReducerClient(socket);
  this.address_ = address;

  log('Reducer %s created.', id);
};

Reducer.prototype = {
  id: function() { return this.id_; },

  isAvailable: function() { return this.isAvailable_; },

  becameAvailable: function() {
    log('Reducer %s became available.', this.id_);
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

  registerJob: function(jobId, reduceFunction, onSuccess, onError) {
    this.client_.registerJob.apply(this.client_, arguments);
  }

};

module.exports = Reducer;
