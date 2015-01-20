var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  logName: 'nmr:mapper:ControllerClient',

  register: function(address) {
    this.send('mapper:register', {address: address});
  },

  chunkProcessed: function(jobId, chunkId, errorMessage) {
    this.send('mapper:chunk:processed', {jobId: jobId, chunkId: chunkId, err: errorMessage});
  }
});

module.exports = ControllerClient;
