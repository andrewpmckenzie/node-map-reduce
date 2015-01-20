var util = require("util");

var Registry = require('../../../common/base/Registry');

var PartitionerRegistry = Registry.extend({
  logName: 'nmr:controller:PartitionerRegistry',

  getFirstAvailable: function() {
    return this.getAll().filter(function(p) { return p.isAvailable(); })[0];
  }
});

module.exports = PartitionerRegistry;
