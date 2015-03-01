Template.jobList.helpers({
  jobs: function () {
    var jobMap = {};
    Jobs.find().forEach(function(job) {
      var id = job.jobId;
      if (! (id in jobMap)) {
        jobMap[id] = {id: id};
      }
      jobMap[id][job.serverType] = jobMap[id][job.serverType] || {};
      jobMap[id][job.serverType][job.address] = job.details;
    });

    this.data = Object.keys(jobMap).map(function(key) { return jobMap[key]; });
    return this.data;
  }
});
