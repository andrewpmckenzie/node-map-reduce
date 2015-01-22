var events = require('events');
var Class = require('base-class-extend');

var EventEmitter = Class.extend({
  constructor: function() {
    EventEmitter.call(this);
  }
}).extend(events.EventEmitter.prototype);

module.exports = EventEmitter;
