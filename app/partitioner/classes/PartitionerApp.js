var util = require("util");

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var ReducerClient = require('./client/ReducerClient');
var JobRegistry = require('./helper/JobRegistry');
var Job = require('./model/Job');

var PartitionerApp = App.extend({
  logName: 'nmr:partitioner:PartitionerApp',

  constructor: function(port, controllerUrl) {
    PartitionerApp.super_.apply(this, arguments);
    this.log('PartitionerApp(%s, %s) called.', port, controllerUrl);

    this.jobRegistry_ = new JobRegistry();
    this.controllerClient_ = new ControllerClient(controllerUrl);
    this.setupControllerSocket(this.controllerClient_.socket());

    this.address(function(address) {
      this.controllerClient_.register(address);
    }.bind(this));
  },

  setupSocket: function(socket) {
    this.setupMapperSocket(socket);
  },

  setupMapperSocket: function(socket) {
    this.ioEndpoint(socket, 'chunk:partition', ['jobId', 'chunkId', 'payload'], this.handleMappedChunk_.bind(this));
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'reducerAddresses'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
  },

  registerJob_: function(options, replyFn) {
    this.log('registerJob_(%o) called.', options);

    var reducers = options.reducerAddresses.map(function(address) {
      return new ReducerClient(address, options.jobId);
    }.bind(this));

    var job = new Job(options.jobId, reducers, this.controllerClient_);
    this.jobRegistry_.add(job);
    replyFn({
      success: true
    });
  },

  handleMappedChunk_: function(options) {
    this.log('handleMappedChunk_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (!job) {
      this.log('ERROR: could not find job %s to process chunk.', options.jobId);
    } else {
      job.process(options.chunkId, options.payload);
    }
  },

  deleteJob_: function(options) {
    this.log('deleteJob_(%o) called.', options);
    this.jobRegistry_.remove(options.jobId);
  }
});

module.exports = PartitionerApp;
