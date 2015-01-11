var JobRegistry = require('./JobRegistry');

var ServiceBag = function() {
  this.jobRegistry = new JobRegistry();
};

module.exports = ServiceBag;
