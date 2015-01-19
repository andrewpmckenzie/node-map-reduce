var util = require("util");
var log = require('debug')('node-map-reduce:mapper:JobRegistry');

var Registry = require('../../../common/base/Registry');

var ControllerRegistry = Registry.extend({

});

module.exports = ControllerRegistry;
