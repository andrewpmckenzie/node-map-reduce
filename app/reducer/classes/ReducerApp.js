var util = require("util");

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var PartitionerClient = require('./client/PartitionerClient');
var JobRegistry = require('./helper/JobRegistry');
var Job = require('./model/Job');

var ReducerApp = App.extend({
  logName: 'nmr:reducer:ReducerApp',

  constructor: function(port, controllerUrl) {
    ReducerApp.super_.apply(this, arguments);
    this.log('ReducerApp(%s, %s) called.', port, controllerUrl);

    this.jobRegistry_ = new JobRegistry();
    this.controllerClient_ = new ControllerClient(controllerUrl);
    this.setupControllerSocket(this.controllerClient_.socket());

    this.address(function(address) {
      this.controllerClient_.register(address);
    }.bind(this));
  },

  setupSocket: function(socket) {
    this.setupPartitionerSocket(socket);
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'reduceFunction'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
    this.ioEndpoint(socket, 'job:results', ['jobId'], this.getResults_.bind(this));
  },

  setupPartitionerSocket: function(socket) {
    var partitionerClient = new PartitionerClient(socket);
    this.ioEndpoint(socket, 'job:kv:process', ['jobId', 'chunkIds', 'key', 'values'], this.processKeyValues_.bind(this, partitionerClient));
  },

  registerJob_: function(options, replyFn) {
    this.log('registerJob_(%o) called.', options);
    var job = new Job(options.jobId, options.reduceFunction, this.controllerClient_);
    this.jobRegistry_.add(job);
    replyFn({
      success: true
    });
  },

  deleteJob_: function(options) {
    this.log('deleteJob_(%o) called.', options);
    this.jobRegistry_.remove(options.jobId);
  },

  processKeyValues_: function(partitionerClient, options) {
    this.log('processKeyValues_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (!job) {
      this.log('ERROR: could not find job %s to process chunk.', options.jobId);
    } else {
      job.process(options.chunkIds, options.key, options.values, partitionerClient);
    }
  },

  getResults_: function(options, cb) {
    this.log('getResults_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (!job) {
      this.log('ERROR: could not find job %s to get results.', options.jobId);
    } else {
      cb(job.results());
    }
  }
});

module.exports = ReducerApp;
