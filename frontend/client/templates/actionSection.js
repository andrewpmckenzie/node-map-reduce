Session.set('actionSectionTemplate', 'actionSectionButtons');

Template.actionSection.helpers({
  currentTemplate: function() { return Session.get('actionSectionTemplate'); }
});

Template.actionSectionButtons.events({
  'click .createJob': function() { Session.set('actionSectionTemplate', 'createJobForm'); return false; }
});
