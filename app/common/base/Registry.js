var log = require('debug')('node-map-reduce:common:Registry');
var Class = require('base-class-extend');

var Registry = Class.extend({
  constructor: function() {
    this.items_ = {};
    this.deletedItems_ = {};
    this.lastId_ = 1;
  },

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
    log('getItem(' + itemId + ') called.');

    var item = this.items_[itemId];

    log('getItem(%s) returned %s.', itemId, item ? ' an item' : 'nothing');
    return item;
  },

  remove: function(itemId) {
    log('deleteItem(' + itemId + ') called.');

    delete this.items_[itemId];
    this.deletedItems_[itemId] = true;
  },

  isRemoved: function(itemId) {
    return !!this.deletedItems_[itemId];
  },

  getUniqueId: function() { return this.lastId_++; },

  getAllIds: function() { return Object.keys(this.items_); },

  numberOfItems: function() { return this.getAllIds().length; },

  getAll: function() {
    return Object.keys(this.items_).map(function(key) { return this.items_[key]; }.bind(this));
  }
});

module.exports = Registry;
