var request = require('request');
var debug = require('debug');
var ioClient = require('socket.io-client');

var Class = require('base-class-extend');

var Client = Class.extend({
  logName: 'nmr:common:Client',

  constructor: function(urlOrSocket) {
    this.log = debug(this.logName);
    this.socket_ = typeof urlOrSocket === 'string' ? ioClient(urlOrSocket) : urlOrSocket;
  },

  send: function(event, payload, response) {
    this.log('send(%s, %o, %s) called.', event, payload, response ? '[function]' : 'undefined');
    this.socket_.emit(event, payload, response);
  },

  socket: function() { return this.socket_; }
});

module.exports = Client;
