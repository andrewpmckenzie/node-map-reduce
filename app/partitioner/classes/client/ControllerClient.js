var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function() {
    this.send('partitioner:register', {});
  }
});

module.exports = ControllerClient;
