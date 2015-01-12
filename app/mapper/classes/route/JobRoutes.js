var express = require('express');
var Job = require('../model/Job');

var JobRoutes = function(services) {
  this.services_ = services;
  this.router_ = express.Router();

  this.router_.get('/', this.listRoute_.bind(this));
  this.router_.get('/:jobId', this.detailRoute_.bind(this));
  this.router_.post('/:jobId/register', this.registerJobRoute_.bind(this));
  this.router_.post('/:jobId/delete', this.deleteJobRoute_.bind(this));
};

JobRoutes.prototype = {
  getRouter: function() {
    return this.router_;
  },

  registerJobRoute_: function(req, res) {
    // TODO: verify required params are provided
    var jogId = req.params.jobId;
    var jobUrl = req.param('jobUrl');
    var mapFunction = req.param('mapFunction');

    var job = new Job(id, mapFunction, jobUrl);
    this.services_.jobRegistry.addJob(job);
    job.start();

    res.status(200).json(job.toJson());
  },

  listRoute_: function(req, res) {
    var jobs = this.services_.jobRegistry.getAllJobIds();
    res.status(200).json(jobs);
  },

  detailRoute_: function(req, res) {
    var jobId = req.params.jobId;
    var job = this.services_.jobRegistry.getJob(jobId);

    if (job) {
      res.status(200).json(job.toJson());
    } else if (this.services_.jobRegistry.isDeleted(jobId)) {
      res.status(410).send('Job was removed.');
    } else {
      res.status(404).send('Job does not exist.');
    }
  },

  deleteJobRoute_: function(req, res) {
    var jobId = req.params.jobId;
    var job = this.services_.jobRegistry.getJob(jobId);
    this.services_.jobRegistry.deleteJob(jobId);

    res.status(200).json(job.toJson());
  }
};

module.exports = JobRoutes;