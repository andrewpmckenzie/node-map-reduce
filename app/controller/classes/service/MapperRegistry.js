var util = require("util");
var log = require('debug')('node-map-reduce:controller:MapperRegistry');

var Registry = require('../../../common/base/Registry');

var MapperRegistry = Registry.extend({

  getForUrl: function (url) {
    var id, ids = this.getAllIds();
    while (id = ids.pop()) {
      var item = this.get(id);
      if (item.url() === url) {
        return item;
      }
    }
    return null;
  }
});

module.exports = MapperRegistry;
