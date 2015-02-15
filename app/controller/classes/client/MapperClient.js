var util = require('util');
var Client = require('../../../common/base/Client');

var MapperClient = Client.extend({
  logName: 'nmr:controller:MapperClient',

  registerJob: function(jobId, mapFunction, partitionerAddress, onSuccess, onError) {
    this.send('job:register', {
      jobId: jobId,
      mapFunction: mapFunction,
      partitionerAddress: partitionerAddress
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

  finishJob: function(jobId) {
    this.send('job:finish', {
      jobId: jobId
    });
  },

  process: function(jobId, chunk) {
    this.send('job:chunk:process', {
      jobId: jobId,
      chunk: chunk
    });
  }

});

module.exports = MapperClient;
