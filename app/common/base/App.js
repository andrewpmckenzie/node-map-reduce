var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var http = require('http');
var io = require('socket.io');
var extend = require('extend');

var log = require('debug')('node-map-reduce:common:App');
var Class = require('base-class-extend');

var App = Class.extend({
  constructor: function (port) {
    log('App(' + port + ') called.');
    this.port_ = port;
    this.express_ = express();

    this.configureExpress_();
    this.setupExpressRoutes(this.express_);
    this.configureGenericRoutes_();

    this.server_ = http.createServer(this.express_);
    this.server_.on('error', this.handleFatalError_.bind(this));
    this.server_.on('listening', this.handleServerStart_.bind(this));

    this.io_ = io(this.server_);
    this.io_.on('connection', function (socket) {
      log('IO socket connection.');
      this.setupSocket(socket);
    }.bind(this));

    this.address_ = null;
    this.addressCallbacks_ = [];
  },

  setupSocket: function(socket) { /** No-op: override to decorate a socket when it connects */ },

  setupExpressRoutes: function(express) { /** No-op: override to add express routes */ },

  start: function() {
    this.server_.listen(this.port_);
    return this;
  },

  ioEndpoint: function(socket, event, requiredParams, callback) {
    socket.on(event, function(params, replyFn) {
      this.verifyParamsExist_(params, requiredParams, event);
      callback(params, replyFn);
    }.bind(this));
  },

  postEndpoint: function(express, route, requiredParams, callback) {
    this.expressEndpoint_('post', express, route, requiredParams, callback);
  },

  getEndpoint: function(express, route, requiredParams, callback) {
    this.expressEndpoint_('get', express, route, requiredParams, callback);
  },

  address: function(cb) {
    this.addressCallbacks_.push(cb);
    this.maybeProcessAddressCallbacks_();
  },

  maybeProcessAddressCallbacks_: function() {
    var address = this.address_;
    if (address) {
      this.addressCallbacks_.forEach(function(cb) { cb(address); });
      this.addressCallbacks_ = [];
    }
  },

  expressEndpoint_: function(method, express, route, requiredParams, callback) {
    express[method](route, function(req, res) {
      var params = extend(req.query, req.params, req.body);
      var err = this.verifyParamsExist_(params, requiredParams, route);

      if (err) {
        res.status(400).json({error: err});
      } else {
        var response = callback(params);
        res.status(200).json(response || {});
      }
    }.bind(this));
  },

  verifyParamsExist_: function(obj, params, name) {
    var msg = null;
    params.forEach(function(param) {
      if (obj[param] === undefined || obj[param] === null) {
        log('ERROR: call to %s is missing %s param', name, param);
        msg = param + ' is required';
      }
    });
    return msg;
  },

  configureExpress_: function() {
    this.express_.use(logger('dev'));
    this.express_.use(bodyParser.json());
    this.express_.use(bodyParser.urlencoded({ extended: false }));
    this.express_.set('port', this.port_);
  },

  configureGenericRoutes_: function() {
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
    log(err);
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
    this.address_ = 'http://' + this.server_.address().address + ':' + this.server_.address().port;
    this.maybeProcessAddressCallbacks_();
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
});

module.exports = App;
