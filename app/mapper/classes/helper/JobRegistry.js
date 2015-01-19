var util = require("util");


var Registry = require('../../../common/base/Registry');

var ControllerRegistry = Registry.extend({
  logName: 'node-map-reduce:mapper:ControllerRegistry'
});

module.exports = ControllerRegistry;
