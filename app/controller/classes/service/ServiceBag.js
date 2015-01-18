var JobRegistry = require('./JobRegistry');
var MapperRegistry = require('./MapperRegistry');

var ServiceBag = function() {
  this.jobRegistry = new JobRegistry();
  this.mapperRegistry = new MapperRegistry();
};

module.exports = ServiceBag;
