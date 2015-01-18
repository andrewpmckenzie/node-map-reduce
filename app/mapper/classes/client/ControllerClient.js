var util = require('util');
var Client = require('../../../common/base/Client');

var ControllerClient = Client.extend({
  register: function(selfUrl, onSuccess, onError) {
    this.post('/mapper/register', {
      url: selfUrl
    }, onSuccess, onError);
  }
});

module.exports = ControllerClient;
