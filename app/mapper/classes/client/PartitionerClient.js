var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  logName: 'nmr:mapper:PartitionerClient',

  partition: function(jobId, payload) {
    this.send('chunk:partition', {jobId: jobId, payload: payload});
  },

  finish: function(jobId) {
    this.send('job:finish', {jobId: jobId});
  }
});

module.exports = PartitionerClient;
