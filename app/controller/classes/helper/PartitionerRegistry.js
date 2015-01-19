var util = require("util");

var Registry = require('../../../common/base/Registry');

var PartitionerRegistry = Registry.extend({
  logName: 'node-map-reduce:controller:PartitionerRegistry'
});

module.exports = PartitionerRegistry;
