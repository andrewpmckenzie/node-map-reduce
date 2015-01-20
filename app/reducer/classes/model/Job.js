// https://github.com/mathiasbynens/jsesc
var jsesc = require('jsesc');

// http://gf3.github.io/sandbox/
var Sandbox = require('sandbox');

var log = require('debug')('node-reduce-reduce:reducer:Job');

var Job = function(
    id,
    reduceFunction,
    client
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.client_ = client;
  this.sandbox_ = new Sandbox({
    timeout: 1000 // TODO: make this configurable
  });
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      options: {
        reduceFunction: this.reduceFunction_
      }
    };
  },

  process: function(chunkId, key, values, partitionerClient) {
    log('process(%s, %s, %o) called', chunkId, key, values);
    partitionerClient.reduced(this.id_, chunkId, key);
  }
};

module.exports = Job;
