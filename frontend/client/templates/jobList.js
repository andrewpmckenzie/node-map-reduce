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

Template.jobList.events({
  'click .viewResult': function(event, template) {
    $(template.find('.resultContainer')).addClass('showResult');
    return false;
  },

  'click .hideResult': function(event, template) {
    $(template.find('.resultContainer')).removeClass('showResult');
    return false;
  }
});
