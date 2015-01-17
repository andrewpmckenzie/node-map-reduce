var util = require("util");
var log = require('debug')('node-map-reduce:mapper:JobRegistry');

var Registry = require('../../../common/base/Registry');

var JobRegistry = function() { };

util.inherits(JobRegistry, Registry);

module.exports = JobRegistry;
