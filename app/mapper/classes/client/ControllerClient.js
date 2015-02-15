var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  logName: 'nmr:mapper:ControllerClient',

  register: function(address) {
    this.send('mapper:register', {address: address});
  },

  chunkError: function(jobId, chunkData, errorMessage) {
    this.send('mapper:chunk:chunkError', {jobId: jobId, chunkData: chunkData, err: errorMessage});
  },

  ready: function(jobId) {
    this.send('mapper:ready', {jobId: jobId});
  }
});

module.exports = ControllerClient;
