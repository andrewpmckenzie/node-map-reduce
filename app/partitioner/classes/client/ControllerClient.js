var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function(address) {
    this.send('partitioner:register', {address: address});
  }
});

module.exports = ControllerClient;
