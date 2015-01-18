var util = require("util");
var log = require('debug')('node-map-reduce:mapper:MapperApp');

var App = require('../../common/base/App');
var JobRoutes = require('./route/JobRoutes');
var ControllerRoutes = require('./route/ControllerRoutes');
var ServiceBag = require('./service/ServiceBag');

var MapperApp = App.extend({
  constructor: function(port) {
    log('MapperApp(' + port + ') called.');
    this.services_ = new ServiceBag();

    MapperApp.super_.apply(this, arguments);
  },

  configureStandardRoutes_: function() {
    this.express_.use('/job', new JobRoutes(this.services_).getRouter());
    this.express_.use('/controller', new ControllerRoutes(this.services_).getRouter());
  },

  discover: function(controllerUrl) {
    log('Discover(' + controllerUrl + ') called.');

    var address = this.server_.address();
    var selfUrl = 'http://' + address.address + ':' + address.port; // TODO: there must be a better way to do this
    this.services_.controllerActions.register(controllerUrl, selfUrl);
    return this;
  }
});

module.exports = MapperApp;
