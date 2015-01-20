var util = require("util");

var App = require('../../common/base/App');
var Job = require('./model/Job');
var JobRegistry = require('./helper/JobRegistry');
var MapperRegistry = require('./helper/MapperRegistry');
var Mapper = require('./model/Mapper');
var PartitionerRegistry = require('./helper/PartitionerRegistry');
var Partitioner = require('./model/Partitioner');
var ReducerRegistry = require('./helper/ReducerRegistry');
var Reducer = require('./model/Reducer');

var ControllerApp = App.extend({
  logName: 'nmr:controller:ControllerApp',

  constructor: function(port) {
    ControllerApp.super_.apply(this, arguments);
    this.log('ControllerApp(' + port + ') called.');

    this.jobRegistry_ = new JobRegistry();
    this.mapperRegistry_ = new MapperRegistry();
    this.partitionerRegistry_ = new PartitionerRegistry();
    this.reducerRegistry_ = new ReducerRegistry();
  },

  setupSocket: function(socket) {
    this.ioEndpoint(socket, 'mapper:register', ['address'], this.newMapper_.bind(this, socket));
    this.ioEndpoint(socket, 'partitioner:register', ['address'], this.newPartitioner_.bind(this, socket));
    this.ioEndpoint(socket, 'reducer:register', ['address'], this.newReducer_.bind(this, socket));
    this.ioEndpoint(socket, 'job:chunk:processed', ['jobId', 'chunkId'], this.chunkProcessed_.bind(this));
  },

  setupExpressRoutes: function(express) {
    this.postEndpoint(express, '/job/new', ['inputUrl', 'reduceFunction', 'mapFunction'], this.newJob_.bind(this));
    this.getEndpoint(express, '/job/:jobId', ['jobId'], this.jobDetail_.bind(this));
  },

  newMapper_: function(socket, options) {
    this.log('newMapper_(socket, %o) called.', options);
    var id = this.mapperRegistry_.getUniqueId();
    var mapper = new Mapper(id, socket, options.address);
    this.mapperRegistry_.add(mapper);
  },

  newPartitioner_: function(socket, options) {
    this.log('newPartitioner_(socket, %o) called.', options);
    var id = this.partitionerRegistry_.getUniqueId();
    var partitioner = new Partitioner(id, socket, options.address);
    this.partitionerRegistry_.add(partitioner);
  },

  newReducer_: function(socket, options) {
    this.log('newReducer_(socket, %o) called.', options);
    var id = this.reducerRegistry_.getUniqueId();
    var reducer = new Reducer(id, socket, options.address);
    this.reducerRegistry_.add(reducer);
  },

  chunkProcessed_: function(options) {
    this.log('chunkProcessed_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);
    if (job) {
      job.mapComplete(options.chunkId, options.err);
    } else {
      this.log('ERROR: Could not find job [%s] for processed chunk.', options.jobId)
    }
  },

  newJob_: function(options) {
    this.log('newJob_(%o) called.', options);
    var id = this.jobRegistry_.getUniqueId();

    // TODO: throttle mappers/reducers passed
    var mappers = this.mapperRegistry_.getAll();
    var reducers = this.reducerRegistry_.getAll();

    var partitioner = this.partitionerRegistry_.getFirstAvailable();

    var job = new Job(
        id,
        options.inputUrl,
        options.reduceFunction,
        options.mapFunction,
        options.chunkDelimiter,
        mappers,
        reducers,
        partitioner
    );
    this.jobRegistry_.add(job);
    job.start();

    return job.toJson();
  },

  jobDetail_: function(options) {
    this.log('jobDetail_(%o) called.', options);
    var job = this.jobRegistry_.get(options.jobId);

    if (job) {
      return job.toJson();
    } else {
      throw new Error('Could not find job ' + options.jobId);
    }
  }
});

module.exports = ControllerApp;
