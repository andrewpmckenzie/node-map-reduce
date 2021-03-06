var _ = require('lodash');
var extend = require('extend');
var log = require('debug')('nmr:controller:Job');
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var UrlInputReader = require('../helper/UrlInputReader');
var JobBase = require('../../../common/model/Job');

var Job = JobBase.extend({
  constructor: function(
    id,
    inputUrl,
    reduceFunction,
    mapFunction,
    chunkDelimiter,
    mappers,
    reducers,
    partitioner
  ) {
    Job.super_.call(this, id);

    this.inputUrl_ = inputUrl || (function() { throw new Error('inputUrl not provided'); })();
    this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
    this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
    this.mappers_ = mappers || (function() { throw new Error('mappers not provided'); })();
    this.reducers_ = reducers || (function() { throw new Error('reducers not provided'); })();
    this.partitioner_ = partitioner || (function() { throw new Error('partitioner not provided'); })();
    this.chunkDelimiter_ = chunkDelimiter || '\n';

    this.rawChunkQueue_ = [];
    this.error_ = undefined;
    this.result_ = null;

    this.status_ = Job.Status.STARTING;

    this.inputReader_ = new UrlInputReader(this.inputUrl_, this.chunkDelimiter_);
    this.inputReader_.onChunks(this.handleChunks_.bind(this));
    this.inputReader_.onDone(this.finish.bind(this));
    this.inputReader_.onError(this.handleReadError_.bind(this));

    if (this.mappers_.length === 0) {
      this.setError_('No mappers available.');
    }

    if (this.reducers_.length === 0) {
      this.setError_('No reducers available.');
    }

    this.mappers_.forEach(function(mapper) {
      mapper.on('available', this.maybeResumeRead_.bind(this));
    }.bind(this));

    this.reducers_.forEach(function(reducer) {
      reducer.on('job:' + this.id_ + ':finished', this.maybeReducingFinished_.bind(this));
    }.bind(this));
  },

  status: function() { return this.status_; },

  toJson: function() {
    return _.extend(Job.super_.prototype.toJson.call(this), {
      status: this.status_,
      error: this.error_,
      result: this.result_,
      runTime: this.runTime_,
      options: {
        inputUrl: this.inputUrl_,
        reduceFunction: this.reduceFunction_,
        mapFunction: this.mapFunction_,
        chunkDelimiter: this.chunkDelimiter_
      }
    });
  },

  start: function() {
    this.registerJobWithNodes_(this.startInputStream_.bind(this));
  },

  canFinish: function() {
    // Make sure there are no chunks queued up to send
    this.maybeResumeRead_();
    return !this.rawChunkQueue_.length;
  },

  bubbleFinish: function() {
    var jobId = this.id_;
    this.mappers_.forEach(function(mapper) { mapper.finishJob(jobId); });
  },

  registerJobWithNodes_: function(onDone) {
    log('registerJobWithNodes_() called.');

    if (this.status_ !== Job.Status.STARTING) {
      log('ERROR: Stopping as Job is in %s state', this.status_);
      return;
    }

    var repliesRemaining = this.mappers_.length + this.reducers_.length + 1 /* partitioner */;

    var maybeDone = function() {
      if (repliesRemaining === 0) {
        if (this.mappers_.length === 0) {
          this.setError_('Could not register with mappers.');
          return;
        }
        if (this.reducers_.length === 0) {
          this.setError_('Could not register with reducers.');
          return;
        }
        log('Registered job with %s mappers, %s reducers, and a partitioner.', this.mappers_.length, this.reducers_.length);
        onDone();
      }
    }.bind(this);

    var registrationSuccess = function() {
      repliesRemaining--;
      maybeDone();
    }.bind(this);

    var partitionerRegistrationError = function() {
      log('Error registering with partitioner ' + this.partitioner_.id());
      this.setError_('Could not register with partitioner.');
    }.bind(this);

    // TODO: handle case where could not register with all reducers
    var reducerAddresses = this.reducers_.map(function(reducer) { return reducer.address(); });
    this.partitioner_.registerJob(this.id_, reducerAddresses, this.mappers_.length, registrationSuccess, partitionerRegistrationError);

    var mapperRegistrationError = function(mapperId) {
      // TODO: alert partitioner of new mapper count
      log('Error registering with mapper ' + mapperId);
      repliesRemaining--;
      this.mappers_ = this.mappers_.filter(function(mapper) { return mapperId !== mapper.id(); });
      maybeDone();
    }.bind(this);

    this.mappers_.forEach(function(mapper) {
      mapper.registerJob(
        this.id_,
        this.mapFunction_,
        this.partitioner_.address(),
        registrationSuccess,
        mapperRegistrationError.bind(this, mapper.id())
      );
    }.bind(this));

    var reducerRegistrationError = function(reducerId) {
      log('Error registering with reducer ' + reducerId);
      repliesRemaining--;
      this.reducers_ = this.reducers_.filter(function(reducer) { return reducerId !== reducer.id(); });
      maybeDone();
    }.bind(this);

    this.reducers_.forEach(function(reducer) {
      reducer.registerJob(this.id_, this.reduceFunction_, registrationSuccess, reducerRegistrationError.bind(this, reducer.id()));
    }.bind(this));
  },

  startInputStream_: function() {
    log('startInputStream_() called.');

    if (this.status_ !== Job.Status.STARTING) {
      log('ERROR: Stopping as Job is in %s state', this.status_);
      return;
    }

    this.inputReader_.read();
    this.updateStatus_(Job.Status.RUNNING);
  },

  handleChunks_: function(chunks) {
    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Chunks received while job in %s state.', this.status_);
      return;
    }

    chunks.forEach(function(rawChunk) {
      this.maybeSendChunkToMapper_(rawChunk);
    }.bind(this));
  },

  maybeSendChunkToMapper_: function(rawChunk) {
    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Trying to send chunk while job in %s state.', this.status_);
      return;
    }

    var availableMapper = this.nextAvailableMapper_();

    if (typeof rawChunk !== 'string') {
      log('Ignoring bad chunk: ' + rawChunk);
    } else if (availableMapper) {
      log('Sending chunk to mapper [%s]: %s', availableMapper.id(), rawChunk);
      availableMapper.process(this.id_, rawChunk);
      return true;
    } else {
      log('No mappers available. Pausing stream.');
      this.rawChunkQueue_.push(rawChunk);
      this.inputReader_.pause();
      return false;
    }

  },

  maybeResumeRead_: function() {
    while (this.maybeSendChunkToMapper_(this.rawChunkQueue_.pop())) { /* no-op */ }

    if (this.rawChunkQueue_.length === 0) {
      log('No chunks left in local queue. Resuming stream.');
      this.inputReader_.resume();
    }
  },

  nextAvailableMapper_: function() {
    // TODO: be smarter about tracking mapper availability
    return this.mappers_.filter(function(mapper) { return mapper.isAvailable(); })[0];
  },

  mapError: function(chunkData, errMsg) {

    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Mapper reported chunk error while job in %s state.', this.status_);
      return;
    }

    log('ERROR: Mapping of chunk errored.');
    log('ERROR: Chunk data: %s', chunkData);
    log('ERROR: Message: %s', errMsg);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);
    this.setError_('Error while mapping "' + chunkData + '": ' + errMsg);
  },

  reduceError: function(erroringObj, errMsg) {

    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Reducer reported error while job in %s state.', this.status_);
      return;
    }

    var objJson = JSON.stringify(erroringObj);

    log('ERROR: Reducing errored.');
    log('ERROR: Chunk data: %s', objJson);
    log('ERROR: Message: %s', errMsg);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    this.setError_('Error while reducing ' + objJson + ': ' + errMsg);
  },

  maybeReducingFinished_: function() {
    log('maybeReducingFinished_() called.');
    var jobId = this.id_;
    var remaining = this.reducers_.reduce(function(m, reducer) { return m + (reducer.isFinished(jobId) ? 0 : 1); }, 0);
    if (remaining === 0) {
      this.setCompleted_();
    } else {
      log('Waiting on %s reducers.', remaining);
    }
  },

  setCompleted_: function() {
    this.displayResults_(function() {
      this.updateStatus_(Job.Status.COMPLETED);
      this.tidyup_();
      console.log('Completed job [' + this.id_ + '] in '+ (((+new Date()) - this.startTime_) / 1000) + 's.');
    }.bind(this));
  },

  displayResults_: function(cb) {
    // TODO: save these to a file from the reducers instead of sending everything back

    var reducersRemaining = this.reducers_.length;
    var result = {};

    this.reducers_.forEach(function(client) {
      client.results(this.id_, function(partialResult) {
        reducersRemaining--;
        result = extend(result, partialResult);
        if (reducersRemaining === 0) {
          this.result_ = result;
          this.update();
          var keys = Object.keys(result);
          log('Job returned %s results.', keys.length);
          keys.forEach(function(k) {
            console.log(k + '    ' + result[k]);
          });
          cb();
        }
      }.bind(this));
    }.bind(this));
  },

  handleReadError_: function(message) { this.setError_(message); },

  setError_: function(message) {
    this.error_ = message;
    this.updateStatus_(Job.Status.ERROR);
    console.log('ERROR Job [%s] errored after %ss: ', this.id_, ((+new Date()) - this.startTime_) / 1000,  message);
    this.tidyup_();
  },

  updateStatus_: function(newStatus) {
    this.status_ = newStatus;
    this.update();
  },

  tidyup_: function() {
    log('tidyup_() called.');
    this.mappers_.forEach(function(mapper) { mapper.deleteJob(this.id_); }.bind(this));
    this.reducers_.forEach(function(reducer) { reducer.deleteJob(this.id_); }.bind(this));
    this.partitioner_.deleteJob(this.id_);
  }

});

Job.Status = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

module.exports = Job;
