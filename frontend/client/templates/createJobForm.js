Template.createJobForm.events({
  'click .cancel': function() { Session.set('actionSectionTemplate', 'actionSectionButtons'); return false; }
});

Template.createJobForm.rendered = function() {
  this.findAll('.editor').forEach(function(el) {
    // http://codemirror.net
    CodeMirror.fromTextArea(el, {
      lineNumbers: true,
      mode: 'javascript'
    });
  });
};
