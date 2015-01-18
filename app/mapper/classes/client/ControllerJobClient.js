var ControllerClient = require('./ControllerClient');

var ORIGIN_AND_PATH_REGEX = /^(https?:\/\/[^\/\?\#]+\/)([^\?\#]+)$/;

var ControllerClient = ControllerClient.extend({
  constructor: function(controllerJobUrl) {
    var parsed = controllerJobUrl.match(ORIGIN_AND_PATH_REGEX);
    if (!parsed) {
      throw new Error('Invalid controller URL provided');
    }
    var baseUrl = parsed[1];
    this.basePath_ = parsed[2];
    ControllerClient.super_.call(this, baseUrl);
  },

  chunkPath_: function(chunkId) { return this.basePath_ + '/chunk/' + chunkId; },

  chunkDone: function(chunkId, onSuccess, onError) {
    var path = this.chunkPath_(chunkId) + '/map-complete';
    this.post(path, { }, onSuccess, onError);
  }
});

module.exports = ControllerClient;
