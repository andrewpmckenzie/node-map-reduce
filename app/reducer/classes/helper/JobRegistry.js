var util = require("util");

var Registry = require('../../../common/base/Registry');

var JobRegistry = Registry.extend({
  logName: 'nmr:reducer:JobRegistry'
});

module.exports = JobRegistry;
