var log = require('debug')('node-map-reduce:mapper:JobRegistry');

var JobRegistry = function() {
  this.jobs_ = {};
  this.deletedJobs_ = {};
  this.lastId_ = 1;
};

JobRegistry.prototype = {
  addJob: function(job) {
    log('addJob(' + job.id() + ') called.');

    var jobId = '' + job.id();
    if (jobId in this.jobs_) {
      throw new Error('Job already registered: ' + id);
    }

    this.jobs_[jobId] = job;
  },

  getJob: function(jobId) {
    log('getJob(' + job.id() + ') called.');

    var job = this.jobs_[jobId];

    log('getJob(' + job.id() + ') returned ' + JSON.stringify(job) + '.');
    return job;
  },

  deleteJob: function(jobId) {
    log('deleteJob(' + job.id() + ') called.');

    delete this.jobs_[jobId];
    this.deletedJobs_[jobId] = true;
  },

  isDeleted: function(jobId) {
    return !!this.deletedJobs_[jobId];
  },

  getUniqueId: function() { return this.lastId_++; },

  getAllJobIds: function() { return Object.keys(this.jobs_); }
};

module.exports = JobRegistry;
