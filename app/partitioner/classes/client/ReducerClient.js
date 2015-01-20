var util = require('util');
var Client = require('../../../common/base/Client');

var ReducerClient = Client.extend({
  reduce: function(jobId, chunkId, key, values) {
    this.send('chunk:reduce', {jobId: jobId, chunkId: chunkId, key: key, values: values});
  }
});

module.exports = ReducerClient;
