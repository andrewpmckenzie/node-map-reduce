var util = require("util");
var log = require('debug')('node-map-reduce:controller:MapperApp');

var App = require('../../common/base/App');
var JobRoutes = require('./route/JobRoutes');
var ControllerRoutes = require('./route/ControllerRoutes');
var ServiceBag = require('./service/ServiceBag');

var MapperApp = function(port) {
  MapperApp.super_.apply(this, arguments);
  log('MapperApp(' + port + ') called.');
  this.services_ = new ServiceBag();
};

util.inherits(MapperApp, App);

MapperApp.prototype.configureStandardRoutes_ = function() {
  this.express_.use('/job', new JobRoutes(this.services_).getRouter());
  this.express_.use('/controller', new ControllerRoutes(this.services_).getRouter());
};

MapperApp.prototype.discover = function(controllerUrl) {
  log('Discover(' + controllerUrl + ') called.');

  var address = this.server_.address();
  var selfUrl = 'http://' + address.address + ':' + address.port; // TODO: there must be a better way to do this
  this.services_.controllerActions.register(controllerUrl, selfUrl);
  return this;
};

module.exports = MapperApp;
