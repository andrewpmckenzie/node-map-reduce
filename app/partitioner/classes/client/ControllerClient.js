var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function(address) {
    this.send('partitioner:register', {address: address});
  },

  chunkProcessed: function(jobId, chunkId, errors) {
    this.send('reducer:chunk:processed', {jobId: jobId, chunkId: chunkId, err: errors});
  }
});

module.exports = ControllerClient;
