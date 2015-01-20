var util = require('util');
var Client = require('../../../common/base/Client');

var PartitionerClient = Client.extend({
  partition: function(jobId, chunkId, payload) {
    this.send('chunk:partition', {jobId: jobId, chunkId: chunkId, payload: payload});
  }
});

module.exports = PartitionerClient;