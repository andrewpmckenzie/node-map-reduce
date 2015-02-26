var _ = require('lodash');
var Model = require('../base/Model');

var Job = Model.extend({
  logName: 'nmr:common:model:Job',

  constructor: function(id) {
    Job.super_.call(this, id);

    this.finished_ = false;
    this.startTime_ = +new Date();
    this.endTime_ = null;

    this.pollForStats_();
  },

  toJson: function() {
    return _.extend(Model.prototype.toJson.call(this), {
      stats: this.generateStats(),
      runningTime: !this.endTime_ ? (+new Date()) - this.startTime_ : null,
      runTime: this.endTime_ ? this.endTime_ - this.startTime_ : null,
      status: this.finished_ ? 'FINISHED' : 'RUNNING'
    });
  },

  generateStats: function() { },

  canFinish: function() { return true; },

  bubbleFinish: function() { },

  finish: function() {
    if (this.finished_) {
      return;
    }

    if (this.canFinish()) {
      this.finished_ = true;
      this.endTime_ = +new Date();
      this.update();
      this.bubbleFinish();
    } else {

      // poll until we can finish
      setTimeout(this.finish.bind(this), 100);
    }
  },

  isFinished: function() { return this.finished_; },

  update: function() { this.emit('update'); },

  pollForStats_: function() {
    this.update();

    if (!this.finished_) {
      setTimeout(this.pollForStats_.bind(this), 1000);
    }
  }
});

module.exports = Job;
