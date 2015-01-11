var Job = function(
    id,
    inputPath,
    reduceFunction,
    mapFunction,
    chunkDelimiter,
    url
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.inputPath_ = inputPath || (function() { throw new Error('inputPath not provided'); })();
  this.reduceFunction_ = reduceFunction || (function() { throw new Error('reduceFunction not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.chunkDelimiter_ = chunkDelimiter || '\n';
  this.url_ = url;
  this.status_ = Job.Status.STARTING;
};

Job.prototype = {
  id: function() { return this.id_; },
  status: function() { return this.status_; },
  toJson: function() {
    return {
      id: this.id_,
      status: this.status_,
      url: this.url_,
      options: {
        inputPath: this.inputPath_,
        reduceFunction: this.reduceFunction_,
        mapFunction: this.mapFunction_,
        chunkDelimiter: this.chunkDelimiter_
      }
    };
  }
};

Job.Status = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED'
};

module.exports = Job;
