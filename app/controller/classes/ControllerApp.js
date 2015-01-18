var util = require("util");
var log = require('debug')('node-map-reduce:controller:ControllerApp');

var App = require('../../common/base/App');
var JobRoutes = require('./route/JobRoutes');
var ServiceBag = require('./service/ServiceBag');

var ControllerApp = App.extend({
  constructor: function(port) {
    log('ControllerApp(' + port + ') called.');
    this.services_ = new ServiceBag();

    ControllerApp.super_.call(this, port);
  },

  configureStandardRoutes_: function(express) {
    express.use('/job', new JobRoutes(this.services_).getRouter());
  }
});

module.exports = ControllerApp;
