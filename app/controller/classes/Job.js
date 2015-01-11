var Job = function(id) {
  this.id_ = id;
  this.status_ = Job.Status.RUNNING;
};

Job.prototype = {
  id: function() { return this.id_; },
  status: function() { return this.status_; },
  toJson: function() {
    return {
      id: this.id_,
      status: this.status_
    };
  }
};

Job.Status = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED'
};

module.exports = Job;
