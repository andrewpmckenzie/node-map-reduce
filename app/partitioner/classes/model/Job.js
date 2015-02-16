var stringHash = require('string-hash');
var log = require('debug')('nmr:partitioner:Job');
var _ = require('lodash');
var util = require('util');

var JobBase = require('../../../common/model/Job');

var Job = JobBase.extend({

  constructor: function(
    id,
    mapperCount,
    reducerClients,
    controllerClient
  ) {
    log('Job(%s, %s, [%s], [%s]) called.', id, mapperCount, typeof reducerClients, typeof controllerClient);
    this.id_ = id  || (function() { throw new Error('id not provided'); })();
    this.reducerClients_ = reducerClients;
    this.controllerClient_ = controllerClient;
    this.activeMappers_ = mapperCount * 1;

    this.partitionCount_ = 0;

    if (this.reducerClients_.length === 0) {
      log('ERROR: No reducers provided.');
    }

  },

  bubbleFinish: function() {
    this.reducerClients_.forEach(function(reducerClient) { reducerClient.finish(); });
  },

  generateStats: function() { return { partitioned: this.partitionCount_ }; },

  mapperFinished: function() {
    log('mapperFinished() called.');
    this.activeMappers_--;
    if (this.activeMappers_ === 0) {
      log('All mappers are finished.');
      this.finish();
    } else {
      log('Waiting on %s mappers to finish.', this.activeMappers_);
    }
    this.update();
  },

  process: function(mappedChunk) {
    log('process(%o) called.', mappedChunk);
    if (this.isFinished()) {
      throw new Error('process(...) called after all mappers finished.', mappedChunk);
    }
    log('Reducer task queue sizes: %s', this.reducerClients_.map(function(r) { return r.tasksQueued(); }).join(', '));
    var keys = Object.keys(mappedChunk);

    if (keys.length === 0) {
      log('Chunk was empty.');
      return;
    }

    // TODO: if reducer queue is growing too large, send andon signal to controller until it abates
    keys.forEach(function(key) {
      var reducer = stringHash(key) % this.reducerClients_.length;
      this.reducerClients_[reducer].reduce(this.id_, key, mappedChunk[key]);
      this.partitionCount_++;
    }.bind(this));
  }

});

module.exports = Job;
