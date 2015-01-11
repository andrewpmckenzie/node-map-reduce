var ControllerApp = require('../classes/ControllerApp');
var debug = require('debug')('node-map-reduce:controller:server');
var http = require('http');

var ControllerServer = function(port) {
  this.port_ = port;
  this.app_ = new ControllerApp();

  var expressApp = this.app_.getExpressApp();
  expressApp.set('port', this.port_);
  this.server_ = http.createServer(expressApp);
  this.decorate();
};

ControllerServer.prototype = {
  decorate: function() {
    this.server_.on('error', this.onError_.bind(this));
    this.server_.on('listening', this.onServerStart_.bind(this));
  },

  start: function() {
    this.server_.listen(this.port_);
  },

  onError_: function(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    switch (error.code) {
      case 'EACCES':
        console.error('Port ' + this.port_ + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error('Port ' + this.port_ + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  },

  onServerStart_: function() {
    console.log('Listening on port ' + this.server_.address().port);
  }
};

module.exports = ControllerServer;
