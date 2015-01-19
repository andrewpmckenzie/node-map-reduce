var request = require('request');
var log = require('debug')('node-map-reduce:common:Client');
var ioClient = require('socket.io-client');

var Class = require('base-class-extend');

var Client = Class.extend({
  constructor: function(urlOrSocket) {
    this.socket_ = typeof urlOrSocket === 'string' ? ioClient(urlOrSocket) : urlOrSocket;
  },

  send: function(event, payload, response) { this.socket_.emit(event, payload, response); },

  socket: function() { return this.socket_; }
});

module.exports = Client;
