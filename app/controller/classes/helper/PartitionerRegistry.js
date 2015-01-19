var util = require("util");

var Registry = require('../../../common/base/Registry');

var PartitionerRegistry = Registry.extend({
  logName: 'nmr:controller:PartitionerRegistry'
});

module.exports = PartitionerRegistry;
