var util = require("util");

var Registry = require('../../../common/base/Registry');

var MapperRegistry = Registry.extend({
  logName: 'node-map-reduce:controller:MapperRegistry'
});

module.exports = MapperRegistry;
