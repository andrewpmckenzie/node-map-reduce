var request = require('request');
var log = require('debug')('nmr:common:Client');
var ioClient = require('socket.io-client');

var Class = require('base-class-extend');

var Client = Class.extend({
  constructor: function(urlOrSocket) {
    this.socket_ = typeof urlOrSocket === 'string' ? ioClient(urlOrSocket) : urlOrSocket;
  },

  send: function(event, payload, response) {
    log('send(%s, %o, %s) called.', event, payload, response ? '[function]' : 'undefined');
    this.socket_.emit(event, payload, response);
  },

  socket: function() { return this.socket_; }
});

module.exports = Client;
