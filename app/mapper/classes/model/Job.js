// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');
var log = require('debug')('nmr:mapper:Job');
var vm = require('vm');
var _ = require('lodash');

var JobBase = require('../../../common/model/Job');
var PartitionerClient = require('../client/PartitionerClient');

var Job = JobBase.extend({

  constructor: function(
    id,
    mapFunction,
    partitionerAddress,
    controllerClient
  ) {
    Job.super_.call(this, id);

    this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
    this.partitionerAddress_ = partitionerAddress || (function() { throw new Error('partitionerAddress not provided'); })();
    this.controllerClient_ = controllerClient;
    this.partitionerClient_ = new PartitionerClient(this.partitionerAddress_);
    this.mapCount_ = 0;
  },

  toJson: function() {
    return _.extend(Job.super_.prototype.toJson.call(this), {
      mapFunction: this.mapFunction_
    });
  },

  // Because we're only processing a single mapping at a time
  canFinish: function() { return true; },

  bubbleFinish: function() { 
    this.partitionerClient_.finish(this.id()); 
  },

  generateStats: function() { return { mapped: this.mapCount_ }; },

  process: function(chunkData) {
    if (this.isFinished()) {
      log('ERROR chunk received after job finished.');
      return;
    }

    log('process(\"%s\") called', chunkData.length > 10 ? chunkData.substr(0, 10) + '...' : chunkData);
    var escapedData = jsesc(chunkData);
    var wrappedFunction = '(' + this.mapFunction_ + ')(\'' + escapedData + '\')';

    var errorMessage = null;
    var didError = false;

    try {
      var result = vm.runInNewContext(wrappedFunction);
    } catch(e) {
      errorMessage = rawResult;
      didError = true;
      log('ERROR Bad chunk caught: %s', chunkData);
      log('ERROR %s', wrappedFunction);
      log('ERROR throws %s', errorMessage);
      this.controllerClient_.chunkError(this.id(), chunkData, errorMessage);
    }

    log('Processed chunk "%s": %o', chunkData, result);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    this.controllerClient_.ready(this.id());

    if (!didError) {
      this.partitionerClient_.partition(this.id(), result);
      this.mapCount_++;
    }
  }

});

module.exports = Job;
