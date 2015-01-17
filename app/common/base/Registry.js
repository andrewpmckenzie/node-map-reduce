var log = require('debug')('node-map-reduce:common:Registry');

var Registry = function() {
  this.items_ = {};
  this.deletedItems_ = {};
  this.lastId_ = 1;
};

Registry.prototype = {
  add: function(item) {
    log('addItem(' + item.id() + ') called.');

    var itemId = '' + item.id();
    if (itemId in this.items_) {
      throw new Error('Item already registered: ' + id);
    }

    this.items_[itemId] = item;
    this.deletedItems_[itemId] = false;
  },

  get: function(itemId) {
    log('getItem(' + item.id() + ') called.');

    var item = this.items_[itemId];

    log('getItem(' + item.id() + ') returned ' + JSON.stringify(item) + '.');
    return item;
  },

  remove: function(itemId) {
    log('deleteItem(' + item.id() + ') called.');

    delete this.items_[itemId];
    this.deletedItems_[itemId] = true;
  },

  isRemoved: function(itemId) {
    return !!this.deletedItems_[itemId];
  },

  getUniqueId: function() { return this.lastId_++; },

  getAllIds: function() { return Object.keys(this.items_); }
};

module.exports = Registry;
