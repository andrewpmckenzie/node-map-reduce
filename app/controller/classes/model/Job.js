var log = require('debug')('node-map-reduce:controller:Job');
var UrlInputReader = require('../helper/UrlInputReader');

var Job = function(
    id,
    inputUrl,
    reduceFunction,
    mapFunction,
    chunkDelimiter,
    url,
    mappers
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.inputUrl_ = inputUrl || (function() { throw new Error('inputUrl not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.url_ = url || (function() { throw new Error('url not provided'); })();
  this.mappers_ = mappers || (function() { throw new Error('mappers not provided'); })();
  this.chunkDelimiter_ = chunkDelimiter || '\n';

  this.error_ = undefined;

  this.status_ = Job.Status.STARTING;
  this.inputReader_ = new UrlInputReader(this.inputUrl_, this.chunkDelimiter_);
  this.inputReader_.onChunks(this.handleChunks_.bind(this));
  this.inputReader_.onDone(this.handleReadDone_.bind(this));
  this.inputReader_.onError(this.handleReadError_.bind(this));

  if (this.mappers_.length === 0) {
    this.setError_('No mappers available.');
  }
};

Job.prototype = {
  id: function() { return this.id_; },

  status: function() { return this.status_; },

  toJson: function() {
    return {
      id: this.id_,
      status: this.status_,
      url: this.url_,
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
    this.registerJobWithNodes_(
      this.startInputStream_.bind(this)
    );
  },

  registerJobWithNodes_: function(onDone) {
    log('registerJobWithNodes_() called.');
    var repliesRemaining = this.mappers_.length;

    if (this.error_) {
      log('Stopping as Job is in error state');
      return;
    }

    var maybeDone = function() {
      if (repliesRemaining === 0) {
        log('Registered job with ' + this.mappers_.length + ' mappers.');
        if (this.mappers_.length === 0) {
          this.setError_('Could not register with mappers.');
        }
        onDone();
      }
    }.bind(this);

    var registrationSuccess = function(mapperId) {
      repliesRemaining--;
      maybeDone();
    };

    var registrationError = function(mapperId) {
      log('Error registering with mapper ' + mapperId);
      repliesRemaining--;
      this.mappers_ = this.mappers_.filter(function(mapper) { return mapperId !== mapper.id(); });
      maybeDone();
    };

    this.mappers_.forEach(function(mapper) {
      mapper.registerJob(
        this.id_,
        this.url_,
        this.mapFunction_,
        registrationSuccess.bind(this, mapper.id()),
        registrationError.bind(this, mapper.id())
      )
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
    chunks.forEach(function(chunk) {
      console.log('GOT CHUNK: ' + chunk.length);
    });
  },

  handleReadDone_: function() {
    this.inputFinished_ = true;
  },

  setCompleted_: function() {
    this.status_ = Job.Status.COMPLETED;
    log('Completed job [%s]', this.id_);
  },

  handleReadError_: function(message) {
    this.setError_(message);
  },

  setError_: function(message) {
    log('ERROR with job ' + this.id_ + ': ' + message);
    this.status_ = Job.Status.ERROR;
    this.error_ = message;
    this.tidyup_();
  },

  tidyup_: function() {
    this.mappers_.forEach(function(mapper) { mapper.deleteJob(this.id_); }.bind(this));
  }

};

Job.Status = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

module.exports = Job;
