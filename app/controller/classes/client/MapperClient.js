var util = require('util');
var Client = require('../../../common/base/Client');

var MapperClient = Client.extend({
  registerJob: function(jobId, mapFunction, onSuccess, onError) {
    this.send('job:register', {
      jobId: jobId,
      mapFunction: mapFunction
    }, function(response) {
      // TODO: this seems dangerous. We need some way of verifying the format of the reply
      if (response.error) {
        onError(response.error);
      } else {
        onSuccess();
      }
    });
  },

  deleteJob: function(jobId) {
    this.send('job:delete', {
      jobId: jobId
    });
  },

  process: function(jobId, chunkId, chunk) {
    this.send('job:chunk:process', {
      jobId: jobId,
      chunkId: chunkId,
      chunk: chunk
    });
  }

});

module.exports = MapperClient;
