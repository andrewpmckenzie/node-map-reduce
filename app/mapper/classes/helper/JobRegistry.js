var util = require("util");


var Registry = require('../../../common/base/Registry');

var JobRegistry = Registry.extend({
  logName: 'nmr:mapper:JobRegistry'
});

module.exports = JobRegistry;
