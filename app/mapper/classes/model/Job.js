var Job = function(
    id,
    mapFunction,
    url
) {
  this.id_ = id  || (function() { throw new Error('id not provided'); })();
  this.mapFunction_ = mapFunction || (function() { throw new Error('mapFunction not provided'); })();
  this.url_ = url || (function() { throw new Error('url not provided'); })();
};

Job.prototype = {
  id: function() { return this.id_; },

  toJson: function() {
    return {
      id: this.id_,
      url: this.url_,
      options: {
        mapFunction: this.mapFunction_
      }
    };
  }
};

module.exports = Job;
