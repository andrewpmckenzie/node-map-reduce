var express = require('express');
var router = express.Router();
var JobRegistry = require('../classes/JobRegistry');
var Job = require('../classes/Job');

var jobRegistry = new JobRegistry();

// TODO: make POST
/* GET create new job */
router.get('/new', function(req, res) {
  var job = new Job(jobRegistry.getUniqueId());
  jobRegistry.addJob(job);
  res.status(200).json(job.toJson());
});

/* GET list all job IDs */
router.get('/list', function(req, res) {
  var jobs = jobRegistry.getAllJobIds();
  res.status(200).json(jobs);
});

/* GET status for job */
router.get('/:jobId', function(req, res) {
  var jobId = req.params.jobId;
  var job = jobRegistry.getJob(jobId);

  if (job) {
    res.status(200).json(job.toJson());
  } else if (jobRegistry.isDeleted(jobId)) {
    res.status(410).send('Job was removed.');
  } else {
    res.status(404).send('Job does not exist.');
  }
});

module.exports = router;
