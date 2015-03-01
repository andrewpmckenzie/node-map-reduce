var util = require("util");

var App = require('../../common/base/App');
var Job = require('./model/Job');
var MapperRegistry = require('./helper/MapperRegistry');
var Mapper = require('./model/Mapper');
var PartitionerRegistry = require('./helper/PartitionerRegistry');
var Partitioner = require('./model/Partitioner');
var ReducerRegistry = require('./helper/ReducerRegistry');
var Reducer = require('./model/Reducer');
var UrlInputReader = require('./helper/UrlInputReader');
var _ = require('lodash');

var ControllerApp = App.extend({
  logName: 'nmr:controller:ControllerApp',

  constructor: function(port) {
    ControllerApp.super_.apply(this, arguments);
    this.log('ControllerApp(' + port + ') called.');

    this.mapperRegistry_ = new MapperRegistry();
    this.partitionerRegistry_ = new PartitionerRegistry();
    this.reducerRegistry_ = new ReducerRegistry();
  },

  setupSocket: function(socket) {
    this.ioEndpoint(socket, 'job:new', ['inputUrl', 'reduceFunction', 'mapFunction'], this.newJob_.bind(this));

    this.ioEndpoint(socket, 'mapper:register', ['address'], this.newMapper_.bind(this, socket));
    this.ioEndpoint(socket, 'partitioner:register', ['address'], this.newPartitioner_.bind(this, socket));
    this.ioEndpoint(socket, 'reducer:register', ['address'], this.newReducer_.bind(this, socket));
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

    this.ioEndpoint(socket, 'mapper:chunk:error', ['jobId', 'chunkData', 'err'], this.mapperChunkError_.bind(this, mapper));
    this.ioEndpoint(socket, 'mapper:ready', ['jobId'], this.mapperReady_.bind(this, mapper));

    this.frontendClients_.forEach(function(client) { client.registerMapper(mapper); });
  },

  newPartitioner_: function(socket, options) {
    this.log('newPartitioner_(socket, %o) called.', options);
    var id = this.partitionerRegistry_.getUniqueId();
    var partitioner = new Partitioner(id, socket, options.address);
    this.partitionerRegistry_.add(partitioner);

    this.frontendClients_.forEach(function(client) { client.registerPartitioner(partitioner); });
  },

  newReducer_: function(socket, options) {
    this.log('newReducer_(socket, %o) called.', options);
    var id = this.reducerRegistry_.getUniqueId();
    var reducer = new Reducer(id, socket, options.address);
    this.reducerRegistry_.add(reducer);

    this.ioEndpoint(socket, 'reducer:chunk:error', ['jobId', 'jobData', 'err'], this.reducerChunkError_.bind(this));
    this.ioEndpoint(socket, 'job:finished', ['jobId'], this.reducerFinished_.bind(this, reducer));

    this.frontendClients_.forEach(function(client) { client.registerReducer(reducer); });
  },

  mapperChunkError_: function(mapper, options) {
    // TODO: send via mapper event
    this.log('mapperChunkError_(%o) called.', options);
    var job = this.getJob(options.jobId);
    if (job) {
      job.mapError(options.chunkData, options.err);
    }
  },

  mapperReady_: function(mapper, options) {
    this.log('mapperReady_(%o) called.', options);
    mapper.becameAvailable();
  },

  reducerFinished_: function(reducer, options) {
    this.log('reducerFinished_(%o) called.', options);
    reducer.finishedJob(options.jobId);
  },

  reducerChunkError_: function(options) {
    // TODO: send via reducer event
    this.log('reducerChunkError_(%o) called.', options);
    var job = this.getJob(options.jobId);
    if (job) {
      job.reduceError(options.jobData, options.err);
    }
  },

  newJob_: function(options) {
    this.log('newJob_(%o) called.', options);
    var id = this.getUniqueJobId();

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
    this.addJob(job);
    job.start();

    return job.toJson();
  },

  jobDetail_: function(options) {
    this.log('jobDetail_(%o) called.', options);
    var job = this.getJob(options.jobId);

    if (job) {
      return job.toJson();
    }
  },

  newFrontend_: function(socket, options) {
    this.log('newFrontend_(socket, %o) called.', options);
    var frontendClient = ControllerApp.super_.prototype.newFrontend_.call(this, socket, options);

    this.ioEndpoint(socket, 'frontend:get-test-input', ['url', 'numberOfChunks', 'delimiter'], this.getTestInput_.bind(this));

    this.partitionerRegistry_.getAll().forEach(function(partitioner) { frontendClient.registerPartitioner(partitioner); });
    this.mapperRegistry_.getAll().forEach(function(mapper) { frontendClient.registerMapper(mapper); });
    this.reducerRegistry_.getAll().forEach(function(reducer) { frontendClient.registerReducer(reducer); });
  },

  getTestInput_: function(options, callback) {
    this.log('getTestInput_(%o, [%s]) called.', options, typeof callback);
    var numberOfChunks = options.numberOfChunks;
    var urlInputReader = new UrlInputReader(options.url, options.delimiter);
    var allChunks = [];
    var done = _.once(function() {
      this.log('Got test input.');
      var chunks = _.take(allChunks, numberOfChunks);
      callback(chunks);
      urlInputReader.stop();
    }.bind(this));

    urlInputReader.onChunks(function(chunks) {
      allChunks = allChunks.concat(chunks);
      if (allChunks.length >= numberOfChunks) {
        done();
      }
    }.bind(this));
    urlInputReader.onDone(done);

    urlInputReader.read();
  }
});

module.exports = ControllerApp;
