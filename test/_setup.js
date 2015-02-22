var childProcess = require('child_process');
var debug = require('debug');
var path = require('path');

var StaticServer = function() {
  this.staticFileserver_ = null;
  this.log_ = debug('nmr:test:_setup:StaticServer');
};

StaticServer.prototype = {
  start: function(cb) {
    this.log_('Starting static server.');
    var staticServer = new (require('node-static')).Server(path.join(__dirname, 'static'));

    this.staticFileserver_ = require('http').createServer(function (request, response) {
      request.addListener('end', function () {
        staticServer.serve(request, response);
      }).resume();
    });
    this.staticFileserver_.on('listening', function() { cb(); });
    this.staticFileserver_.listen(3200);
    this.log_('Static server listening on port 3200.');

    return this;
  },

  stop: function(cb) {
    this.staticFileserver_.close(cb);
    this.log_('Stopped static server.');

    return this;
  }
};

var AppServers = function() {
  this.serversProc_ = null;

  this.log_ = debug('nmr:test:_setup:AppServers');
  this.logServerStdOut_ = require('debug')('nmr:test:server:stdout');
  this.logServerStdErr_ = require('debug')('nmr:test:server:stderr');

  this.controllerClient = null;
  this.mapper1Client = null;
  this.mapper2Client = null;
  this.partitionerClient = null;
  this.reducer1Client = null;
  this.reducer2Client = null;
};

AppServers.prototype = {
  start: function(cb) {
    this.log_('Starting app servers and initializing clients.');
    var serversStarted = false;
    var remainingInitMessages = [
      /Mapper 1 created/, /Mapper 2 created/, /Partitioner 1 created/, /Reducer 1 created/, /Reducer 2 created/
    ];

    this.serversProc_ = childProcess.spawn('make', ['test-servers'], { cwd: path.join(__dirname, '..') });

    // App log output appears in stderr
    this.serversProc_.stderr.on('data', function(data) {
      data.toString().split('\n').forEach(function(msg) {
        if (msg) {
          this.logServerStdErr_(msg);
        }
      }.bind(this));
      remainingInitMessages = remainingInitMessages.filter(function(regex) { return !regex.test(data); });

      if (remainingInitMessages.length === 0 && !serversStarted) {
        this.log_('Starting app servers started.');

        // The server is warmed up
        serversStarted = true;

        // We need to blow away the socket.io-client require cache, otherwise it won't allow us to reconnect.
        Object.keys(require.cache).filter(function(k) { return k.indexOf('io-client') > 0; }).forEach(function(key) {
          delete require.cache[key];
        });
        var ioClient = require('socket.io-client');

        this.controllerClient =  ioClient('http://localhost:3201');
        this.mapper1Client =     ioClient('http://localhost:3202');
        this.mapper2Client =     ioClient('http://localhost:3203');
        this.partitionerClient = ioClient('http://localhost:3204');
        this.reducer1Client =    ioClient('http://localhost:3205');
        this.reducer2Client =    ioClient('http://localhost:3206');

        this.log_('Clients initialized.');
        cb();
      }
    }.bind(this));

    this.serversProc_.stdout.on('data', function(data) {
      data.toString().split('\n').forEach(function(msg) {
        if (msg) {
          this.logServerStdOut_(msg);
        }
      }.bind(this));
    }.bind(this));

    return this;
  },

  stop: function(cb) {
    this.log_('Stopping servers + disconnecting clients.');

    this.log_('Waiting for servers to exit.');
    this.serversProc_.on('close', function() {
      this.log_('All servers exited.');
      cb();
    }.bind(this));

    this.controllerClient.emit('service:shutdown');
    this.mapper1Client.emit('service:shutdown');
    this.mapper2Client.emit('service:shutdown');
    this.partitionerClient.emit('service:shutdown');
    this.reducer1Client.emit('service:shutdown');
    this.reducer2Client.emit('service:shutdown');
    this.log_('Signalled servers to exit.');

    this.controllerClient.disconnect();
    this.mapper1Client.disconnect();
    this.mapper2Client.disconnect();
    this.partitionerClient.disconnect();
    this.reducer1Client.disconnect();
    this.reducer2Client.disconnect();

    this.controllerClient  = null;
    this.mapper1Client     = null;
    this.mapper2Client     = null;
    this.partitionerClient = null;
    this.reducer1Client    = null;
    this.reducer2Client    = null;
    this.log_('Disconnected clients.');

    this.serversProc_ = null;

    return this;
  },

  kill: function() {
    if (this.serversProc_) {
      this.serversProc_.kill();
    }
  }
};

module.exports = {
  StaticServer: StaticServer,
  AppServers: AppServers
};
