var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  logName: 'nmr:partitioner:ControllerClient',

  register: function(address) {
    this.send('partitioner:register', {address: address});
  },

  finished: function(jobId) {
    this.send('partitioner:finished', {jobId: jobId});
  }
});

module.exports = ControllerClient;
