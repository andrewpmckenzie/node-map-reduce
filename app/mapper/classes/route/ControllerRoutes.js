var express = require('express');

var ControllerRoutes = function(services) {
  this.services_ = services;
  this.router_ = express.Router();

  this.router_.post('/discover', this.discoverRoute_.bind(this));
};

ControllerRoutes.prototype = {
  getRouter: function() {
    return this.router_;
  },

  discoverRoute_: function(req, res) {
    // TODO: verify params exist
    var controllerUrl = req.param('url');
    var selfUrl = req.protocol + '://' + req.header('host');
    var controllers = this.services_.controllerActions.register(controllerUrl, selfUrl);
    res.status(200).json(req.headers).end();
  }
};

module.exports = ControllerRoutes;
