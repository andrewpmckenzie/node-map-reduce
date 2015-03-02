Template.job.helpers({
  // Flatten the controller, as there will only ever be one
  controller: function() { return this.controller ? this.controller['-'] : undefined; },

  results: function() {
    if (this.controller && this.controller['-'].result) {
      // results are stored as a 2d array instead of a map to get around mongo key restrictions
      return this.controller['-'].result.map(function(r) { return {k: r[0], v: r[1] }; });
    }
  }
});

Template.job_resultList.created = function() {
  this.resultWidth = new ReactiveVar('auto');
};

Template.job_resultList.rendered = function() {
  var maxWidth = _.max(this.findAll('.resultEntry').map(function(el) { return $(el).outerWidth() + 20; }));
  this.resultWidth.set(maxWidth);
};

Template.job_resultList.helpers({
  resultWidth: function() { return Template.instance().resultWidth.get(); }
});
