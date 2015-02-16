var util = require("util");

var Registry = require('../base/Registry');

var JobRegistry = Registry.extend({
  logName: 'nmr:common:JobRegistry'
});

module.exports = JobRegistry;
