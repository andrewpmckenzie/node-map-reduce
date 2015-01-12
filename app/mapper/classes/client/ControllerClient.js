var Client = require('./Client');

var ControllerClient = function(baseUrl) {
  this.baseUrl_ = baseUrl;
  this.client_ = new Client(baseUrl);
};

ControllerClient.prototype = {
  register: function(selfUrl, onSuccess, onError) {
    this.client_.post('/mapper/register', {
      url: selfUrl
    }, onSuccess, onError);
  }
};

module.exports = ControllerClient;
