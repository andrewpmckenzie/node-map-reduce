Jobs = new Mongo.Collection("jobs");

JobsHelper = {
  getAll: function() {
    return JobsHelper.unify_(Jobs.find());
  },

  getOne: function(jobId) {
    var map = JobsHelper.unify_(Jobs.find({jobId: jobId}));
    return map[jobId];
  },

  unify_: function(jobs) {
    var jobMap = {};

    jobs.forEach(function(job) {
      var id = job.jobId;
      if (! (id in jobMap)) {
        jobMap[id] = {id: id};
      }
      jobMap[id][job.serverType] = jobMap[id][job.serverType] || {};
      jobMap[id][job.serverType][job.address] = job.details;
    });

    return jobMap;
  }
};

if (Meteor.isServer) {
  // Start with a fresh DB
  Jobs.remove({});
}
