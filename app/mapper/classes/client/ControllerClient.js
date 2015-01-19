var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function() {
    this.send('mapper:register', {});
  },

  chunkProcessed: function(jobId, chunkId) {
    this.send('job:chunk:processed', {jobId: jobId, chunkId: chunkId});
  }
});

module.exports = ControllerClient;
