var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  registerJob: function(jobId, reducerAddresses, onSuccess, onError) {
    this.send('job:register', {
      jobId: jobId,
      reducerAddresses: reducerAddresses
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
  }

});

module.exports = PartitionerClient;
