var express = require('express');
var Job = require('../model/Job');

var JobRoutes = function(services) {
  this.services_ = services;
  this.router_ = express.Router();

  this.router_.get('/', this.listRoute_.bind(this));
  this.router_.post('/new', this.newJobRoute_.bind(this));
  this.router_.get('/:jobId', this.detailRoute_.bind(this));
};

JobRoutes.prototype = {
  getRouter: function() {
    return this.router_;
  },

  newJobRoute_: function(req, res) {
    // TODO: verify required params are provided
    var inputUrl = req.param('inputUrl');
    var reduceFunction = req.param('reduceFunction');
    var mapFunction = req.param('mapFunction');
    var chunkDelimiter = req.param('chunkDelimiter');
    var id = this.services_.jobRegistry.getUniqueId();
    var jobUrl = req.protocol + '://' + req.get('host') + '/job/' + id;

    // TODO: throttle mappers passed
    var mappers = this.services_.mapperRegistry.getAll();

    var job = new Job(
        id,
        inputUrl,
        reduceFunction,
        mapFunction,
        chunkDelimiter,
        jobUrl,
        mappers
    );
    this.services_.jobRegistry.add(job);
    job.start();

    res.status(200).json(job.toJson());
  },

  listRoute_: function(req, res) {
    var jobs = this.services_.jobRegistry.getAllIds();
    res.status(200).json(jobs);
  },

  detailRoute_: function(req, res) {
    var jobId = req.params.jobId;
    var job = this.services_.jobRegistry.get(jobId);

    if (job) {
      res.status(200).json(job.toJson());
    } else if (this.services_.jobRegistry.isRemoved(jobId)) {
      res.status(410).send('Job was removed.');
    } else {
      res.status(404).send('Job does not exist.');
    }
  }
};

module.exports = JobRoutes;
