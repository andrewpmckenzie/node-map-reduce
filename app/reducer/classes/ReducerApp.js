var util = require("util");
var log = require('debug')('node-map-reduce:reducer:ReducerApp');

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var JobRegistry = require('./helper/JobRegistry');
var Job = require('./model/Job');

var ReducerApp = App.extend({
  constructor: function(port, controllerUrl) {
    log('ReducerApp(%s, %s) called.', port, controllerUrl);
    ReducerApp.super_.apply(this, arguments);

    this.jobRegistry_ = new JobRegistry();
    this.controllerClient_ = new ControllerClient(controllerUrl);
    this.controllerClient_.register();
    this.setupControllerSocket(this.controllerClient_.socket());
  },

  setupSocket: function(socket) {
    this.setupControllerSocket(socket);
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'reduceFunction'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
  },

  setupPartitionerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:segment:process', ['jobId', 'chunkId', 'key', 'values'], this.processJobSegment_.bind(this));
  },

  registerJob_: function(options, replyFn) {
    log('registerJob_(%o) called.', options);
    var job = new Job(options.jobId, options.reduceFunction, this.controllerClient_);
    this.jobRegistry_.add(job);
    replyFn({
      success: true
    });
  },

  deleteJob_: function(options) {
    log('deleteJob_(%o) called.', options);
    this.jobRegistry_.remove(options.jobId);
  },

  processJobSegment_: function(options) {
    log('processJobSegment_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (!job) {
      log('ERROR: could not find job %s to process chunk', options.jobId);
    } else {
      job.process(options.chunkId, options.chunk, options.key, options.values);
    }
  }
});

module.exports = ReducerApp;
