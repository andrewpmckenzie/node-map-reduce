var JobRegistry = require('./JobRegistry');
var ControllerActions = require('./ControllerActions');

var ServiceBag = function() {
  this.jobRegistry = new JobRegistry();
  this.controllerActions = new ControllerActions();
};

module.exports = ServiceBag;
