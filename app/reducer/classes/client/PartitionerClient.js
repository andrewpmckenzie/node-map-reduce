var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  logName: 'nmr:reducer:PartitionerClient',

  reduced: function(jobId, chunkIds, key, error) {
    this.send('job:kv:reduced', {jobId: jobId, chunkIds: chunkIds, key: key, error: error});
  }
});

module.exports = PartitionerClient;
