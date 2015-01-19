var util = require("util");
var log = require('debug')('node-map-reduce:controller:ControllerApp');

var App = require('../../common/base/App');
var Job = require('./model/Job');
var JobRegistry = require('./helper/JobRegistry');
var MapperRegistry = require('./helper/MapperRegistry');
var Mapper = require('./model/Mapper');

var ControllerApp = App.extend({
  constructor: function(port) {
    log('ControllerApp(' + port + ') called.');
    this.jobRegistry_ = new JobRegistry();
    this.mapperRegistry_ = new MapperRegistry();

    ControllerApp.super_.call(this, port);
  },

  setupSocket: function(socket) {
    this.ioEndpoint(socket, 'mapper:register', [], this.newMapper_.bind(this, socket));
    this.ioEndpoint(socket, 'job:chunk:processed', ['jobId', 'chunkId'], this.chunkProcessed_.bind(this));
  },

  setupExpressRoutes: function(express) {
    this.postEndpoint(express, '/job/new', ['inputUrl', 'reduceFunction', 'mapFunction'], this.newJob_.bind(this));
    this.getEndpoint(express, '/job/:jobId', ['jobId'], this.jobDetail_.bind(this));
  },

  newMapper_: function(socket, options) {
    log('newMapper_(socket, %o) called.', options);
    var id = this.mapperRegistry_.getUniqueId();
    var mapper = new Mapper(id, socket);
    this.mapperRegistry_.add(mapper);
  },

  chunkProcessed_: function(options) {
    log('chunkProcessed_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (job) {
      job.mapComplete(options.chunkId, options.err);
    } else {
      log('ERROR: Could not find job [%s] for processed chunk.', options.jobId)
    }
  },

  newJob_: function(options) {
    log('newJob_(%o) called.', options);
    var id = this.jobRegistry_.getUniqueId();

    // TODO: throttle mappers passed
    var mappers = this.mapperRegistry_.getAll();

    var job = new Job(
        id,
        options.inputUrl,
        options.reduceFunction,
        options.mapFunction,
        options.chunkDelimiter,
        mappers
    );
    this.jobRegistry_.add(job);
    job.start();

    return job.toJson();
  },

  jobDetail_: function(options) {
    log('jobDetail_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);

    if (job) {
      return job.toJson();
    } else {
      throw new Error('Could not find job ' + options.jobId);
    }
  }
});

module.exports = ControllerApp;
