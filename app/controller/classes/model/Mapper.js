var MapperClient = require('../client/MapperClient');

var Mapper = function(id, url) {
  this.id_ = id;
  this.url_ = url;
};

Mapper.prototype = {
  id: function() { return this.id_; },

  url: function() { return this.url_; },

  toJson: function() {
    return {
      id: this.id_,
      url: this.url_
    }
  },

  client: function() { return new MapperClient(this.url_); }

};

module.exports = Mapper;
