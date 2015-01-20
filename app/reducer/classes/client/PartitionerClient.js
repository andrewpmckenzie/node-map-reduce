var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  logName: 'nmr:reducer:PartitionerClient',

  reduced: function(jobId, chunkId, key) {
    this.send('job:kv:reduced', {jobId: jobId, chunkId: chunkId, key: key});
  }
});

module.exports = PartitionerClient;
