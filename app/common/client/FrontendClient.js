var util = require('util');
var Client = require('../base/Client');

var FrontendClient = Client.extend({
  logName: 'nmr:common:FrontendClient',

  addJob: function(job) { this.send('job:added', job.toJson()); },

  updateJob: function(job) { this.send('job:updated', job.toJson()); },

  registerMapper: function(mapper) { this.send('mapper:registered', { address: mapper.address() }); },

  registerPartitioner: function(partitioner) { this.send('partitioner:registered', { address: partitioner.address() }); },

  registerReducer: function(reducer) { this.send('reducer:registered', { address: reducer.address() }); }
});

module.exports = FrontendClient;
