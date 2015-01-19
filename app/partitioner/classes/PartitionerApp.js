var util = require("util");
var log = require('debug')('node-map-reduce:partitioner:PartitionerApp');

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var JobRegistry = require('./helper/JobRegistry');
var Job = require('./model/Job');

var PartitionerApp = App.extend({
  constructor: function(port, controllerUrl) {
    log('PartitionerApp(%s, %s) called.', port, controllerUrl);
    PartitionerApp.super_.apply(this, arguments);

    this.jobRegistry_ = new JobRegistry();
    this.controllerClient_ = new ControllerClient(controllerUrl);
    this.controllerClient_.register();
    this.setupControllerSocket(this.controllerClient_.socket());
  },

  setupSocket: function(socket) {
    this.setupControllerSocket(socket);
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'mapFunction'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
  },

  registerJob_: function(options, replyFn) {
    log('registerJob_(%o) called.', options);
    var job = new Job(options.jobId, options.mapFunction, this.controllerClient_);
    this.jobRegistry_.add(job);
    replyFn({
      success: true
    });
  },

  deleteJob_: function(options) {
    log('deleteJob_(%o) called.', options);
    this.jobRegistry_.remove(options.jobId);
  }
});

module.exports = PartitionerApp;
