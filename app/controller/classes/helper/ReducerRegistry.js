var util = require("util");

var Registry = require('../../../common/base/Registry');

var ReducerRegistry = Registry.extend({
  logName: 'node-map-reduce:controller:ReducerRegistry'
});

module.exports = ReducerRegistry;
