var request = require('request');

var Client = function(baseUrl) {
  this.baseUrl_ = baseUrl;
};

Client.prototype = {
  request_: function(method, path, data, onSuccess, onError) {
    data = data || data;
    onSuccess = onSuccess || function() {};
    onError = onError || function() {};
    var url = this.baseUrl_ + path;

    var options = {
      url: url,
      method: method,
      json: true
    };

    options[method === 'GET' ? 'qs' : 'form'] = data;

    request(options, function(err, response, body) {
      if (err) {
        if (onError) {
          onError(err);
        }
      } else {
        onSuccess(body);
      }
    });
  },

  get: function(path, data, onSuccess, onError) {
    this.request_('GET', path, data, onSuccess, onError);
  },

  post: function(path, data, onSuccess, onError) {
    this.request_('POST', path, data, onSuccess, onError);
  }
};

module.exports = Client;
