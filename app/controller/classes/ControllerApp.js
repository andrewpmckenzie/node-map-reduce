var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var http = require('http');
var log = require('debug')('node-map-reduce:controller:ControllerApp');

var JobRoutes = require('./route/JobRoutes');
var ServiceBag = require('./service/ServiceBag');

var ControllerApp = function(port) {
  log('ControllerApp(' + port + ') called.');
  this.port_ = port;
  this.services_ = new ServiceBag();
  this.express_ = express();

  this.configureExpress_();
  this.configureRoutes_();

  this.server_ = http.createServer(this.express_);
  this.server_.on('error', this.handleFatalError_.bind(this));
  this.server_.on('listening', this.handleServerStart_.bind(this));
};

ControllerApp.prototype = {

  start: function() {
    this.server_.listen(this.port_);
  },

  configureExpress_: function() {
    this.express_.use(logger('dev'));
    this.express_.use(bodyParser.json());
    this.express_.use(bodyParser.urlencoded({ extended: false }));
    this.express_.set('port', this.port_);
  },

  configureRoutes_: function() {
    this.express_.use('/job', new JobRoutes(this.services_).getRouter());

    // Error routes
    this.express_.use(this.handleNotFound_.bind(this));
    if (this.express_.get('env') === 'development') {
      this.express_.use(this.handleDevError_.bind(this));
    } else {
      this.express_.use(this.handleProdError_.bind(this));
    }
  },

  handleNotFound_: function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  },

  handleDevError_: function(err, req, res, next) {
    res.status(err.status || 500).json({
      message: err.message,
      error: err
    });
  },

  handleProdError_: function(err, req, res, next) {
    res.status(err.status || 500).json({ message: "Something went wrong" });
  },

  handleServerStart_: function() {
    log('Server started on port ' + this.server_.address().port + '.');
  },

  handleFatalError_: function(error) {
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
  }
};

module.exports = ControllerApp;
