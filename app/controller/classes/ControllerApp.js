var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var JobRoutes = require('./route/JobRoutes');
var ServiceBag = require('./service/ServiceBag');

var ControllerApp = function() {
  this.services_ = new ServiceBag();
  this.express_ = express();

  this.express_.use(logger('dev'));
  this.express_.use(bodyParser.json());
  this.express_.use(bodyParser.urlencoded({ extended: false }));
  this.express_.use(express.static(path.join(__dirname, 'public')));
  this.setupRoutes_();
};

ControllerApp.prototype = {

  getExpressApp: function() { return this.express_; },

  setupRoutes_: function() {
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
  }
};

module.exports = ControllerApp;
