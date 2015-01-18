var util = require('util');
var Client = require('../../../common/base/Client');

var MapperClient = Client.extend({
  registerJob: function(jobId, jobUrl, mapFunction, opt_onSuccess, opt_onError) {
    this.post('/job/' + jobId + '/register', {
      jobUrl: jobUrl,
      mapFunction: mapFunction
    }, opt_onSuccess, opt_onError);
  },

  deleteJob: function(jobId, opt_onSuccess, opt_onError) {
    this.post('/job/' + jobId + '/delete', { }, opt_onSuccess, opt_onError);
  },

  jobDetails: function(jobId, opt_onSuccess, opt_onError) {
    this.get('/job/' + jobId, { }, opt_onSuccess, opt_onError);
  },

  jobListing: function(jobId, opt_onSuccess, opt_onError) {
    this.get('/job', { }, opt_onSuccess, opt_onError);
  },

  process: function(jobId, chunkId, chunk, opt_onSuccess, opt_onError) {
    this.post('/job/' + jobId + '/chunk/' + chunkId + '/process', { chunk: chunk }, opt_onSuccess, opt_onError);
  }

});

module.exports = MapperClient;
