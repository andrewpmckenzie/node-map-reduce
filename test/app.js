var assert = require('assert');
var expect = require('expect.js'); // https://github.com/Automattic/expect.js

var AppServer = require('./_setup').AppServers;
var StaticServer = require('./_setup').StaticServer;

describe('App', function(){
  this.slow(1000);
  this.timeout(60000);

  var gettysburgUrl = 'http://localhost:3200/gettysburg.txt';
  var wordcountMapFunction = 'function(line) { var words = {}; line.replace(/[^\s\w]/g, "").split(/\s/).forEach(function(w) { w = w.toLowerCase(); words[w] = (words[w] || 0) + 1; }); return words; }';
  var wordcountReduceFunction = 'function(memo, values){ return ((memo || 0) * 1) + values.reduce(function(memo, value) { return memo + (value * 1); }, 0); }';

  var linecountMapFunction = 'function(line) { return {count: 1}; }';
  var linecountReduceFunction = 'function(memo, values){ var total = (memo||0) * 1; values.forEach(function(v) { total += ((v||0) * 1); }); return total; }';

  var appServer = null;

  it('should start a new job', function(done){
    appServer.controllerClient.on('job:added', function(data) {
      expect(data.options.inputUrl).to.eql(gettysburgUrl);
      expect(data.options.mapFunction).to.eql(wordcountMapFunction);
      expect(data.options.reduceFunction).to.eql(wordcountReduceFunction);
      expect(data.status).to.eql('STARTING');
      done();
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: wordcountMapFunction,
      reduceFunction: wordcountReduceFunction
    });
  });

  it('should complete a job', function(done){

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        expect(data.result.count).to.eql(25);
        done();
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: linecountMapFunction,
      reduceFunction: linecountReduceFunction
    });

  });

  it('should report mapper errors', function(done){

    var erroringMapFunction = 'function(line) { throw new Error("Bang bang, my baby shot me down.".toUpperCase()); }';

    appServer.controllerClient.on('job:updated', function(data) {

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

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: erroringMapFunction,
      reduceFunction: linecountReduceFunction
    });

  });

  it('should report reducer errors', function(done){

    var erroringReduceFunction = 'function(line) { throw new Error("Bang bang, I hit the ground.".toUpperCase()); }';

    appServer.controllerClient.on('job:updated', function(data) {

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

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: linecountMapFunction,
      reduceFunction: erroringReduceFunction
    });

  });

  it('should pass the correct types to the reducer function', function(done) {

    var numberReturningMapFunction = 'function(line) { return {count: 1}; }';
    var numberProcessingReduceFunction = 'function(memo, values){ values.forEach(function(v) { if (typeof v !== "number") throw new Error("Value was " + (typeof v)); }); return 1; }';

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        expect(data.result.count).to.eql(1);
        done();
      } else if (data.status === 'ERROR') {
        done(new Error('Job errored: ' + data.error));
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: numberReturningMapFunction,
      reduceFunction: numberProcessingReduceFunction
    });
  });

  it('should pass the correct memo type to the reducer function', function(done) {

    var numberReturningMapFunction = 'function(line) { return {count: 1}; }';
    var numberProcessingReduceFunction = 'function(memo, values){ if (typeof memo !== "number" && typeof memo !== "undefined") { throw new Error("Memo was a [" + (typeof memo) + "]."); }; return (memo || 0) + values.length; }';

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        expect(data.result.count).to.eql(25);
        done();
      } else if (data.status === 'ERROR') {
        done(new Error('Job errored: ' + data.error));
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: numberReturningMapFunction,
      reduceFunction: numberProcessingReduceFunction
    });
  });

  it('errors if the map function does not return an object', function(done) {

    var numberReturningMapFunction = 'function(line) { return "foo"; }';
    var numberProcessingReduceFunction = linecountReduceFunction;

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        done(new Error('Job completed, but should return an error.'));
      } else if (data.status === 'ERROR') {
        expect(data.error).to.contain('Mapper must return an object but returned [string] instead.');
        done();
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: numberReturningMapFunction,
      reduceFunction: numberProcessingReduceFunction
    });
  });

  it('errors if the map function returns an Array', function(done) {

    var numberReturningMapFunction = 'function(line) { return ["foo"]; }';
    var numberProcessingReduceFunction = linecountReduceFunction;

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        done(new Error('Job completed, but should return an error.'));
      } else if (data.status === 'ERROR') {
        expect(data.error).to.contain('Mapper must return an object but returned [Array] instead.');
        done();
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: numberReturningMapFunction,
      reduceFunction: numberProcessingReduceFunction
    });
  });

  // Setup / Teardown
  var staticServer = null;

  before('Start static server', function(done) {
    staticServer = new StaticServer().start(done);
  });

  beforeEach('Start app servers and initialize clients', function(done) {
    appServer = new AppServer().start(done);
  });

  after('Stop static server', function(done) {
    staticServer.stop(done);
    staticServer = null;
  });

  afterEach('Stop servers and disconnect clients', function(done) {
    appServer.stop(done);
    appServer = null;
  });

  // Kill server if we prematurely exit (e.g. because of SIGTERM or uncaught error)
  process.on('exit', function() {
    if (appServer) {
      appServer.kill();
    }
  });
});
