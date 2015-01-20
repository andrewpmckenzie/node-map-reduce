var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function(address) {
    this.send('mapper:register', {address: address});
  },

  chunkProcessed: function(jobId, chunkId, keys, errorMessage) {
    this.send('mapper:chunk:processed', {jobId: jobId, chunkId: chunkId, keys: keys, err: errorMessage});
  }
});

module.exports = ControllerClient;
