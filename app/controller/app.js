var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var job = require('./routes/job');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/job', job);

// catch 404 and continue to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler (stacktrace)
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
        message: err.message,
        error: err
    });
  });
}

// production error handler (no stacktrace)
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({ message: "Something went wrong" });
});

module.exports = app;
