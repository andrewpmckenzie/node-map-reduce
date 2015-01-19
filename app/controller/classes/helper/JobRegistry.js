var util = require("util");

var Registry = require('../../../common/base/Registry');

var JobRegistry = Registry.extend({
  logName: 'nmr:controller:JobRegistry'
});

module.exports = JobRegistry;
