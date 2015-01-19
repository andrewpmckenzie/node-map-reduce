var http = require('http');
var https = require('https');
var log = require('debug')('nmr:controller:UrlInputReader');

var UrlInputReader = function(url, delimiter) {
  log('UrlInputReader(%s, %s) created.', url, delimiter);
  this.url_ = url;
  this.delimiter_ = delimiter;
  this.chunkHandlers_ = [];
  this.doneHandlers_ = [];
  this.errorHandlers_ = [];

  this.response_ = null;
  this.partialChunk_ = '';
  this.isPaused_ = false;
};

UrlInputReader.prototype = {
  onChunks: function(callback) { this.chunkHandlers_.push(callback); },

  onDone: function(callback) { this.doneHandlers_.push(callback); },

  onError: function(callback) { this.errorHandlers_.push(callback); },

  read: function() {
    log('read() called.');
    (/^https:\/\//.test(this.url_) ? https : http).get(this.url_, function(response) {
      response.setEncoding('utf8');
      response.on('data', this.handleData_.bind(this));
      response.on('end', this.handleClose_.bind(this));
      this.response_ = response;
    }.bind(this)).on('error', this.handleError_.bind(this));
  },

  pause: function() {
    log('pause() called.');
    if (this.response_ && !this.isPaused_) {
      this.response_.pause();
      this.isPaused_ = true;
    }
  },

  resume: function() {
    log('resume() called.');
    if (this.response_ && this.isPaused_) {
      this.response_.resume();
      this.isPaused_ = false;
    }
  },

  handleClose_: function() {
    log('handleClose_() called.');
    this.response_ = null;
    var finalChunk = [this.partialChunk_];
    this.partialChunk_ = [];

    this.chunkHandlers_.forEach(function(chunkHandler) { chunkHandler(finalChunk); });
    this.doneHandlers_.forEach(function(callback) { callback(); });
  },

  handleError_: function() {
    log('handleError_() called.');
    this.response_ = null;
    this.errorHandlers_.forEach(function(callback) { callback(e.message); });
  },

  handleData_: function(data) {
    data = this.partialChunk_ + data;
    this.partialChunk_ = '';
    var chunks = data.split(this.delimiter_);

    // Will be text if it's a partial chunk, or an empty string
    // if the delimiter appeared at the end of the stream or data
    // was empty.
    this.partialChunk_ = chunks.pop();

    this.chunkHandlers_.forEach(function(chunkHandler) { chunkHandler(chunks); });
  }
};

module.exports = UrlInputReader;
