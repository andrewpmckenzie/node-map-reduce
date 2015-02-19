var assert = require('assert');
var childProcess = require('child_process');
var log = require('debug')('nmr:test:app');
// https://github.com/Automattic/expect.js
var expect = require('expect.js');
var path = require('path');

describe('App', function(){
  this.slow(1000);
  this.timeout(60000);

  var gettysburgUrl = 'http://localhost:3200/gettysburg.txt';
  var wordcountMapFunction = 'function(line) { var words = {}; line.replace(/[^\s\w]/g, "").split(/\s/).forEach(function(w) { w = w.toLowerCase(); words[w] = (words[w] || 0) + 1; }); return words; }';
  var wordcountReduceFunction = 'function(memo, values){ return ((memo || 0) * 1) + values.reduce(function(memo, value) { return memo + (value * 1); }, 0); }';

  var linecountMapFunction = 'function(line) { return {count: 1}; }';
  var linecountReduceFunction = 'function(memo, values){ var total = (memo||0) * 1; values.forEach(function(v) { total += ((v||0) * 1); }); return total; }';

  var controllerClient = null;
  var mapper1Client = null;
  var mapper2Client = null;
  var partitionerClient = null;
  var reducer1Client = null;
  var reducer2Client = null;

  it('should start a new job', function(done){
    controllerClient.on('job:added', function(data) {
      expect(data.options.inputUrl).to.eql(gettysburgUrl);
      expect(data.options.mapFunction).to.eql(wordcountMapFunction);
      expect(data.options.reduceFunction).to.eql(wordcountReduceFunction);
      expect(data.status).to.eql('STARTING');
      done();
    });

    controllerClient.emit('frontend:register');
    controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: wordcountMapFunction,
      reduceFunction: wordcountReduceFunction
    });
  });

  it('should complete a job', function(done){

    controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        expect(data.result.count).to.eql(25);
        done();
      }
    });

    controllerClient.emit('frontend:register');
    controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: linecountMapFunction,
      reduceFunction: linecountReduceFunction
    });

  });

  it('should report mapper errors', function(done){

    var erroringMapFunction = 'function(line) { throw new Error("Bang bang, my baby shot me down.".toUpperCase()); }';

    controllerClient.on('job:updated', function(data) {

      if (data.status === 'ERROR') {
        expect(data.error).to.contain('Error while mapping');
        expect(data.error).to.contain('BANG BANG, MY BABY SHOT ME DOWN.');
        expect(data.result).to.be(null);
        done();
      }

      if (data.status === 'COMPLETED') {
        done(new Error('COMPLETED was reported'));
      }
    });

    controllerClient.emit('frontend:register');
    controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: erroringMapFunction,
      reduceFunction: linecountReduceFunction
    });

  });

  it('should report reducer errors', function(done){

    var erroringReduceFunction = 'function(line) { throw new Error("Bang bang, I hit the ground.".toUpperCase()); }';

    controllerClient.on('job:updated', function(data) {

      if (data.status === 'ERROR') {
        expect(data.error).to.contain('Error while reducing');
        expect(data.error).to.contain('BANG BANG, I HIT THE GROUND.');
        expect(data.result).to.be(null);
        done();
      }

      if (data.status === 'COMPLETED') {
        done(new Error('COMPLETED was reported'));
      }
    });

    controllerClient.emit('frontend:register');
    controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: linecountMapFunction,
      reduceFunction: erroringReduceFunction
    });

  });

  // Setup / Teardown

  var serversProc = null;
  var staticFileserver = null;

  before('Start static server', function(done) {
    var staticServer = new (require('node-static')).Server(path.join(__dirname, 'static'));

    staticFileserver = require('http').createServer(function (request, response) {
      request.addListener('end', function () {
        staticServer.serve(request, response);
      }).resume();
    });

    staticFileserver.on('listening', done);
    staticFileserver.listen(3200);
  });

  beforeEach('Start app servers and initialize clients', function(done) {
    var serversStarted = false;
    var remainingInitMessages = [
      /Mapper 1 created/, /Mapper 2 created/, /Partitioner 1 created/, /Reducer 1 created/, /Reducer 2 created/
    ];

    serversProc = childProcess.spawn('make', ['test-servers'], { cwd: path.join(__dirname, '..') });
    // App log output appears in stderr
    serversProc.stderr.on('data', function(data) {
      log(data.toString());
      remainingInitMessages = remainingInitMessages.filter(function(regex) { return !regex.test(data); });

      if (remainingInitMessages.length === 0 && !serversStarted) {
        // The server is warmed up
        serversStarted = true;

        // We need to blow away the socket.io-client require cache, otherwise it won't allow us to reconnect.
        Object.keys(require.cache).filter(function(k) { return k.indexOf('io-client') > 0; }).forEach(function(key) {
          delete require.cache[key];
        });
        var ioClient = require('socket.io-client');

        controllerClient =  ioClient('http://localhost:3201');
        mapper1Client =     ioClient('http://localhost:3202');
        mapper2Client =     ioClient('http://localhost:3203');
        partitionerClient = ioClient('http://localhost:3204');
        reducer1Client =    ioClient('http://localhost:3205');
        reducer2Client =    ioClient('http://localhost:3206');

        done();
      }
    });
    serversProc.stdout.on('data', function(data) { log(data.toString()); });
  });

  after('Stop static server', function(done) {
    staticFileserver.close(done);
  });

  afterEach('Stop servers and disconnect clients', function(done) {
    controllerClient.disconnect();
    mapper1Client.disconnect();
    mapper2Client.disconnect();
    partitionerClient.disconnect();
    reducer1Client.disconnect();
    reducer2Client.disconnect();

    serversProc.on('close', done);
    serversProc.kill();

    controllerClient  = null;
    mapper1Client     = null;
    mapper2Client     = null;
    partitionerClient = null;
    reducer1Client    = null;
    reducer2Client    = null;
    serversProc       = null;
  });

  // Kill server if we prematurely exit (e.g. because of SIGTERM or uncaught error)
  process.on('exit', function() {
    if (serversProc) {
      serversProc.kill();
    }
  });
});
