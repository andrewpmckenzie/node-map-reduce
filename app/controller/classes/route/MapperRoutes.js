var express = require('express');
var Mapper = require('../model/Mapper');

var MapperRoutes = function(services) {
  this.services_ = services;
  this.router_ = express.Router();

  this.router_.get('/', this.listRoute_.bind(this));
  this.router_.post('/register', this.registerMapperRoute_.bind(this));
  this.router_.get('/:mapperId', this.detailRoute_.bind(this));
};

MapperRoutes.prototype = {
  getRouter: function() {
    return this.router_;
  },

  registerMapperRoute_: function(req, res) {
    // TODO: verify required params are provided
    var mapperUrl = req.param('url');
    var id = this.services_.mapperRegistry.getUniqueId();

    var existingMapper = this.services_.mapperRegistry.getForUrl(mapperUrl);

    if (!existingMapper) {
      var mapper = new Mapper(id, mapperUrl);
      this.services_.mapperRegistry.add(mapper);

      res.status(200).json(mapper.toJson());
    } else {
      res.status(200).json(existingMapper.toJson());
    }
  },

  listRoute_: function(req, res) {
    var jobs = this.services_.mapperRegistry.getAllIds();
    res.status(200).json(jobs);
  },

  detailRoute_: function(req, res) {
    var mapperId = req.params.mapperId;
    var mapper = this.services_.mapperRegistry.get(mapperId);

    if (mapper) {
      res.status(200).json(mapper.toJson());
    } else if (this.services_.mapperRegistry.isRemoved(mapperId)) {
      res.status(410).send('Mapper was removed.');
    } else {
      res.status(404).send('Mapper does not exist.');
    }
  }
};

module.exports = MapperRoutes;
