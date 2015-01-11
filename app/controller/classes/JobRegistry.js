var JobRegistry = function() {
  this.jobs_ = {};
  this.deletedJobs_ = {};
  this.lastId_ = 0;
};

JobRegistry.prototype = {
  addJob: function(job) {
    var jobId = '' + job.id();
    if (jobId in this.jobs_) {
      throw new Error('Job already registered: ' + id);
    }

    this.jobs_[jobId] = job;
  },

  getJob: function(jobId) {
    return this.jobs_[jobId];
  },

  deleteJob: function(jobId) {
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
