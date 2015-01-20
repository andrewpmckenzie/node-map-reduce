var util = require('util');
var Client = require('../../../common/base/Client');

var ReducerClient = Client.extend({
  logName: 'nmr:partitioner:ReducerClient',

  reduce: function(jobId, chunkId, key, values) {
    this.send('job:kv:process', {jobId: jobId, chunkId: chunkId, key: key, values: values});
  }
});

module.exports = ReducerClient;
