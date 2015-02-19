var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  logName: 'nmr:reducer:ControllerClient',

  register: function(address) {
    this.send('reducer:register', {address: address});
  },

  finished: function(jobId) {
    this.send('job:finished', {jobId: jobId});
  },

  error: function(jobId, jobData, errorMessage) {
    this.send('reducer:chunk:error', {jobId: jobId, jobData: jobData, err: errorMessage});
  }
});

module.exports = ControllerClient;
