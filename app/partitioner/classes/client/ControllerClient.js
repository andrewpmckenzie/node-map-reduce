var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function(address) {
    this.send('partitioner:register', {address: address});
  },

  chunkProcessed: function(jobId, chunkId, errorMessage) {
    this.send('reducer:chunk:processed', {jobId: jobId, chunkId: chunkId, err: errorMessage});
  }
});

module.exports = ControllerClient;
