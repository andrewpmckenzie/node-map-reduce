var util = require("util");

var App = require('../../common/base/App');
var ControllerClient = require('./client/ControllerClient');
var JobRegistry = require('./helper/JobRegistry');
var Job = require('./model/Job');

var PartitionerApp = App.extend({
  logName: 'node-map-reduce:partitioner:PartitionerApp',

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
    this.setupControllerSocket(socket);
  },

  setupControllerSocket: function(socket) {
    this.ioEndpoint(socket, 'job:register', ['jobId', 'mapFunction'], this.registerJob_.bind(this));
    this.ioEndpoint(socket, 'job:delete', ['jobId'], this.deleteJob_.bind(this));
  },

  registerJob_: function(options, replyFn) {
    this.log('registerJob_(%o) called.', options);
    var job = new Job(options.jobId, options.mapFunction, this.controllerClient_);
    this.jobRegistry_.add(job);
    replyFn({
      success: true
    });
  },

  deleteJob_: function(options) {
    this.log('deleteJob_(%o) called.', options);
    this.jobRegistry_.remove(options.jobId);
  }
});

module.exports = PartitionerApp;
