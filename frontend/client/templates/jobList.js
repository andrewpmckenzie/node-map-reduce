Template.jobList.helpers({
  jobs: function () {
    var jobMap = JobsHelper.getAll();
    this.data = Object.keys(jobMap).map(function(key) { return jobMap[key]; });
    return this.data;
  }
});

Template.jobList_item.helpers({
  // Flatten the controller, as there will only ever be one
  controller: function() { return this.controller['-']; }
});

Template.jobList_item.events({
  'click': function(event, template) { window.location.href = '/job/' + this.id; }
});
