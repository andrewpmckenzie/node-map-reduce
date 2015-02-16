var util = require("util");

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var Job = require('./model/Job');

var MapperApp = App.extend({
  logName: 'nmr:mapper:MapperApp',

  constructor: function(port, controllerUrl) {
    MapperApp.super_.apply(this, arguments);
    this.log('MapperApp(%s, %s) called.', port, controllerUrl);

    this.controllerClient_ = new ControllerClient(controllerUrl);
    this.setupControllerSocket(this.controllerClient_.socket());

    this.address(function(address) {
      this.controllerClient_.register(address);
    }.bind(this));
  },

  setupSocket: function(socket) {
    this.setupControllerSocket(socket);
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'mapFunction', 'partitionerAddress'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
    this.ioEndpoint(socket, 'job:finish', ['jobId'], this.finishJob_.bind(this));
    this.ioEndpoint(socket, 'job:chunk:process', ['jobId', 'chunk'], this.processJobChunk_.bind(this));
  },

  registerJob_: function(options, replyFn) {
    this.log('registerJob_(%o) called.', options);
    var job = new Job(options.jobId, options.mapFunction, options.partitionerAddress, this.controllerClient_);
    job.on('update', this.sendFrontendUpdate_.bind(this, job));
    this.addJob(job);
    replyFn({
      success: true
    });
  },

  deleteJob_: function(options) {
    this.log('deleteJob_(%o) called.', options);
    this.removeJob(options.jobId);
  },

  finishJob_: function(options) {
    this.log('finishJob_(%o) called.', options);
    var job = this.getJob(options.jobId);
    if (job) {
      job.finish();
    }
  },

  processJobChunk_: function(options) {
    this.log('processJobChunk_(%o) called.', options);
    var job = this.getJob(options.jobId);
    if (job) {
      job.process(options.chunk);
    }
  }
});

module.exports = MapperApp;
