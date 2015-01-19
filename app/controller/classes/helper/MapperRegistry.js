var util = require("util");

var Registry = require('../../../common/base/Registry');

var MapperRegistry = Registry.extend({
  logName: 'nmr:controller:MapperRegistry'
});

module.exports = MapperRegistry;
