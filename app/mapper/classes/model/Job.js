// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');
var vm = require('vm');

var log = require('debug')('nmr:mapper:Job');
var PartitionerClient = require('../client/PartitionerClient');

var Job = function(
    id,
    mapFunction,
    partitionerAddress,
    controllerClient
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.partitionerAddress_ = partitionerAddress || (function() { throw new Error('partitionerAddress not provided'); })();
  this.controllerClient_ = controllerClient;
  this.partitionerClient_ = new PartitionerClient(this.partitionerAddress_);
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      options: {
        mapFunction: this.mapFunction_
      }
    };
  },

  process: function(chunkId, chunkData) {
    log('process(%s, \"%s\") called', chunkId, chunkData.length > 10 ? chunkData.substr(0, 10) + '...' : chunkData);
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
    }

    log('Processed chunk [%s]: %o', chunkId, result);
    log('Memory state: [%s/%s]', process.memoryUsage().heapUsed, process.memoryUsage().heapTotal);

    this.controllerClient_.chunkProcessed(this.id_, chunkId, errorMessage);
    if (!didError) {
      this.partitionerClient_.partition(this.id_, chunkId, result);
    }
  }
};

module.exports = Job;
