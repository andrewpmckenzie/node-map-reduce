var util = require("util");
var log = require('debug')('node-map-reduce:controller:ControllerApp');

var App = require('../../common/base/App');
var JobRoutes = require('./route/JobRoutes');
var ServiceBag = require('./service/ServiceBag');

var ControllerApp = function(port) {
  ControllerApp.super_.apply(this, arguments);
  log('ControllerApp(' + port + ') called.');
  this.services_ = new ServiceBag();
};

util.inherits(ControllerApp, App);

ControllerApp.prototype.configureStandardRoutes_ = function() {
  this.express_.use('/job', new JobRoutes(this.services_).getRouter());
};

module.exports = ControllerApp;
