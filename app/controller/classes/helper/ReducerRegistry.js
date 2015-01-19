var util = require("util");

var Registry = require('../../../common/base/Registry');

var ReducerRegistry = Registry.extend({
  logName: 'nmr:controller:ReducerRegistry'
});

module.exports = ReducerRegistry;
