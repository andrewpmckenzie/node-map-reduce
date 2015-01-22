var extend = require('extend');
var log = require('debug')('nmr:controller:Job');
var UrlInputReader = require('../helper/UrlInputReader');
var ChunkRegistry = require('../helper/ChunkRegistry');
var Chunk = require('./Chunk');

var Job = function(
    id,
    inputUrl,
    reduceFunction,
    mapFunction,
    chunkDelimiter,
    mappers,
    reducers,
    partitioner
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.inputUrl_ = inputUrl || (function() { throw new Error('inputUrl not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.mappers_ = mappers || (function() { throw new Error('mappers not provided'); })();
  this.reducers_ = reducers || (function() { throw new Error('reducers not provided'); })();
  this.partitioner_ = partitioner || (function() { throw new Error('partitioner not provided'); })();
  this.chunkDelimiter_ = chunkDelimiter || '\n';
  this.inputFinished_ = false;

  this.startTime_ = null;
  this.endTime_ = null;

  this.chunkRegistry_ = new ChunkRegistry();
  this.erroringChunkThreshold_ = 10; // TODO: don't hardcode this

  this.rawChunkQueue_ = [];
  this.error_ = undefined;

  this.status_ = Job.Status.STARTING;
  this.inputReader_ = new UrlInputReader(this.inputUrl_, this.chunkDelimiter_);
  this.inputReader_.onChunks(this.handleChunks_.bind(this));
  this.inputReader_.onDone(this.handleReadDone_.bind(this));
  this.inputReader_.onError(this.handleReadError_.bind(this));

  if (this.mappers_.length === 0) {
    this.setError_('No mappers available.');
  }

  if (this.reducers_.length === 0) {
    this.setError_('No reducers available.');
  }
};

Job.prototype = {
  id: function() { return this.id_; },

  status: function() { return this.status_; },

  toJson: function() {
    return {
      id: this.id_,
      status: this.status_,
      error: this.error_,
      options: {
        inputUrl: this.inputUrl_,
        reduceFunction: this.reduceFunction_,
        mapFunction: this.mapFunction_,
        chunkDelimiter: this.chunkDelimiter_
      }
    };
  },

  start: function() {
    this.startTime_ = +new Date();
    this.registerJobWithNodes_(
      this.startInputStream_.bind(this)
    );
  },

  registerJobWithNodes_: function(onDone) {
    log('registerJobWithNodes_() called.');

    if (this.error_) {
      log('Stopping as Job is in error state');
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
    this.partitioner_.registerJob(this.id_, reducerAddresses, registrationSuccess, partitionerRegistrationError);

    var mapperRegistrationError = function(mapperId) {
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

    if (this.error_) {
      log('Stopping as Job is in error state');
      return;
    }

    this.inputReader_.read();
    this.status_ = Job.Status.RUNNING;
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
      var chunk = new Chunk(
        this.chunkRegistry_.getUniqueId(),
        rawChunk
      );
      chunk.setMapping(availableMapper);
      this.chunkRegistry_.add(chunk);

      log('Sending chunk [%s] to mapper [%s]: %s', chunk.id(), availableMapper.id(), rawChunk);
      availableMapper.process(this.id_, chunk.id(), rawChunk);
      return true;
    } else {
      log('No mappers available. Pausing stream.');
      this.rawChunkQueue_.push(rawChunk);
      this.inputReader_.pause();
      return false;
    }

  },

  maybeResumeRead_: function() {
    while (this.maybeSendChunkToMapper_(this.rawChunkQueue_.pop())) {
      // no-op
    }
    if (this.rawChunkQueue_.length === 0) {
      log('No chunks left in local queue. Resuming stream.');
      this.inputReader_.resume();
    }
  },

  nextAvailableMapper_: function() {
    // TODO: be smarter about tracking mapper availability
    return this.mappers_.filter(function(mapper) { return mapper.isAvailable(); })[0];
  },

  mapComplete: function(chunkId, err) {
    var chunk = this.chunkRegistry_.get(chunkId);

    if (!chunk) {
      log('ERROR: Chunk [%s] not found.', chunkId);
      return;
    }

    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Mapper reported completion of chunk [%s] while job in %s state.', chunkId, this.status_);
      return;
    }

    log('Mapping of chunk [%s] complete.', chunkId);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    // TODO: change these lines to reflect reducing state once we have reducers
    if (err) {
      chunk.setError('mapping', err);
    } else {
      chunk.setReducing();
    }
    this.chunkRegistry_.tidy();

    this.maybeError_();
    this.maybeCompleteOrResume_();
  },

  reduceComplete: function(chunkId, err) {
    var chunk = this.chunkRegistry_.get(chunkId);

    if (!chunk) {
      log('ERROR: Chunk [%s] not found.', chunkId);
      return;
    }

    if (this.status_ !== Job.Status.RUNNING) {
      log('ERROR: Reducer reported completion of chunk [%s] while job in %s state.', chunkId, this.status_);
      return;
    }

    log('Reducing of chunk [%s] complete.', chunkId);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    // TODO: change these lines to reflect reducing state once we have reducers
    if (err) {
      chunk.setError('reducing', err);
    } else {
      chunk.setDone();
    }
    this.chunkRegistry_.tidy();

    this.maybeError_();
    this.maybeCompleteOrResume_();
  },

  maybeCompleteOrResume_: function() {
    if (this.inputFinished_ && !this.rawChunkQueue_.length) {
      var chunksProcessing = this.chunkRegistry_.numberOfItems();
      if (chunksProcessing > 0) {
        log('Almost done. Waiting on %s chunks to finish.', chunksProcessing);
      } else {
        log('Nothing left to do!');
        this.setCompleted_();
      }
    } else {
      this.maybeResumeRead_();
    }
  },

  maybeError_: function() {
    var erroringChunks = this.chunkRegistry_.erroringChunks();
    if (erroringChunks.length > this.erroringChunkThreshold_) {
      var message = 'Number of erroring chunks (' + erroringChunks.length + ') is greater than allowed amount (' + this.erroringChunkThreshold_ + ').';
      this.setError_(message);
    }
  },

  handleReadDone_: function() {
    this.inputFinished_ = true;
  },

  setCompleted_: function() {
    this.status_ = Job.Status.COMPLETED;
    this.maybePrintErroringChunks_();
    this.displayResults_(function() {
      this.tidyup_();
      this.stopTimer_();
      log('Completed job [%s] in %ss.', this.id_, this.runTime_ / 1000);
      console.log('Completed job [' + this.id_ + '] in '+ (this.runTime_ / 1000) + 's.');
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
          var keys = Object.keys(result);
          log('Job returned %s results.', keys.length);
          keys.forEach(function(k) {
            console.log(k + '    ' + result[k]);
          });
          cb();
        }
      });
    }.bind(this));
  },

  maybePrintErroringChunks_: function() {
    var erroringChunks = this.chunkRegistry_.erroringChunks();
    if (erroringChunks.length) {
      log('ERROR Job [%s] could not proccess these chunks:', this.id_);
      erroringChunks.forEach(function(chunk) {
        log('ERROR  - %o', chunk.error());
      });
    }
  },

  stopTimer_: function() {
    this.endTime_ = +new Date();
    this.runTime_ = this.endTime_ - this.startTime_;
  },

  handleReadError_: function(message) {
    this.setError_(message);
  },

  setError_: function(message) {
    this.status_ = Job.Status.ERROR;
    this.error_ = message;
    this.stopTimer_();
    this.maybePrintErroringChunks_();
    log('ERROR Job [%s] errored after %ss: ', this.id_, this.runTime_ / 1000, message);
    console.log('ERROR Job ['+this.id_+'] errored after '+(this.runTime_ / 1000)+'s: ', message);
    this.tidyup_();
  },

  tidyup_: function() {
    log('tidyup_() called.');
    this.mappers_.forEach(function(mapper) { mapper.deleteJob(this.id_); }.bind(this));
    this.reducers_.forEach(function(reducer) { reducer.deleteJob(this.id_); }.bind(this));
    this.partitioner_.deleteJob(this.id_);
  }

};

Job.Status = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

module.exports = Job;
