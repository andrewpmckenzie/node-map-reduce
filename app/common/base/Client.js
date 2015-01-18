var request = require('request');
var log = require('debug')('node-map-reduce:common:Client');
var Class = require('base-class-extend');

var Client = Class.extend({
  constructor: function(baseUrl) {
    this.baseUrl_ = baseUrl;
  },

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

    log(method + ' request to ' + url);
    request(options, function(err, response, body) {
      var isError = err || /^[^2]/.test('' + response.statusCode);
      if (isError) {
        log('ERROR response from ' + url + ': ' + JSON.stringify(response));
        if (onError) {
          onError(err || response.body);
        }
      } else {
        log('SUCCESS response from ' + url + '.');
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
});

module.exports = Client;
