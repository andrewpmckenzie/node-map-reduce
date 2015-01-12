var ControllerClient = require('../client/ControllerClient');

var ControllerActions = function() {

};

ControllerActions.prototype = {
  /**
   * Register this mapper with a discovered controller.
   */
  register: function(controllerUrl, selfUrl, opt_onSuccess, opt_onError) {
    new ControllerClient(controllerUrl).register(selfUrl, opt_onSuccess, opt_onError);
  }
};

module.exports = ControllerActions;
