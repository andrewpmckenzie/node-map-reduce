var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  logName: 'nmr:reducer:PartitionerClient',

  reduced: function(jobId, key, error) {
    this.send('job:kv:reduced', {jobId: jobId, key: key, error: error});
  }
});

module.exports = PartitionerClient;
