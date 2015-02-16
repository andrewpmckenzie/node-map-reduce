var debug = require('debug');

var EventEmitter = require('./EventEmitter');

var Model = EventEmitter.extend({
  logName: 'nmr:common:Model',

  constructor: function(id) {
    Model.super_.call(this);

    this.log = debug(this.logName);
    this.id_ = id  || (function() { throw new Error('id not provided'); })();
  },

  toJson: function() {
    return { id: this.id_ };
  },

  id: function() { return this.id_; }
});

module.exports = Model;
