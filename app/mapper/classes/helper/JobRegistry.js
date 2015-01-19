var util = require("util");


var Registry = require('../../../common/base/Registry');

var JobRegistry = Registry.extend({
  logName: 'node-map-reduce:mapper:JobRegistry'
});

module.exports = JobRegistry;
