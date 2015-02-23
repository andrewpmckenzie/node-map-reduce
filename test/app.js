var assert = require('assert');
var expect = require('expect.js'); // https://github.com/Automattic/expect.js

var AppServer = require('./_setup').AppServers;
var StaticServer = require('./_setup').StaticServer;

describe('App', function(){
  this.slow(1000);
  this.timeout(60000);

  var gettysburgUrl = 'http://localhost:3200/gettysburg.txt';

  var WORDCOUNT_MAP_FUNCTION = function(line) {
    var words = {};
    line.replace(/[^\s\w]/g, "").split(/\s/).forEach(function(w) {
      w = w.toLowerCase(); words[w] = (words[w] || 0) + 1;
    });
    return words;
  }.toString();

  var WORDCOUNT_REDUCE_FUNCTION = function(memo, values){
    return ((memo || 0) * 1) + values.reduce(function(memo, value) {
      return memo + (value * 1);
    }, 0);
  }.toString();

  var LINECOUNT_MAP_FUNCTION = function(line) {
    return { count: 1 };
  }.toString();

  var LINECOUNT_REDUCE_FUNCTION = function(memo, values){
    var total = (memo||0) * 1;
    values.forEach(function(v) {
      total += ((v||0) * 1);
    });
    return total;
  }.toString();

  var UNIMPORTANT_MAP_FUNCTION = function(line) { return { foo: 'bar' }; }.toString();

  var UNIMPORTANT_REDUCE_FUNCTION = function(memo, values) { return ''; }.toString();

  var appServer = null;

  it('should start a new job', function(done){
    appServer.controllerClient.on('job:added', function(data) {
      expect(data.options.inputUrl).to.eql(gettysburgUrl);
      expect(data.options.mapFunction).to.eql(UNIMPORTANT_MAP_FUNCTION);
      expect(data.options.reduceFunction).to.eql(UNIMPORTANT_REDUCE_FUNCTION);
      expect(data.status).to.eql('STARTING');
      done();
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: UNIMPORTANT_MAP_FUNCTION,
      reduceFunction: UNIMPORTANT_REDUCE_FUNCTION
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
      mapFunction: LINECOUNT_MAP_FUNCTION,
      reduceFunction: LINECOUNT_REDUCE_FUNCTION
    });

  });

  it('should report mapper errors', function(done){

    var ERRORING_MAP_FUNCTION = function(line) {
      throw new Error("Bang bang, my baby shot me down.".toUpperCase());
    }.toString();

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
      mapFunction: ERRORING_MAP_FUNCTION,
      reduceFunction: UNIMPORTANT_REDUCE_FUNCTION
    });

  });

  it('should report reducer errors', function(done){

    var ERRORING_REDUCE_FUNCTION = function(line) {
      throw new Error("Bang bang, I hit the ground.".toUpperCase());
    }.toString();

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
      mapFunction: UNIMPORTANT_MAP_FUNCTION,
      reduceFunction: ERRORING_REDUCE_FUNCTION
    });

  });

  it('should pass the correct types to the reducer function', function(done) {

    var NUMBER_VERIFYING_MAP_FUNCTION = function(memo, values){
      values.forEach(function(v) {
        if (typeof v !== "number") throw new Error("Value was " + (typeof v));
      });
      return 1;
    }.toString();

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
      mapFunction: LINECOUNT_MAP_FUNCTION,
      reduceFunction: NUMBER_VERIFYING_MAP_FUNCTION
    });
  });

  it('should pass the correct memo type to the reducer function (trying with number)', function(done) {

    var NUMBER_MEMO_VERIFYING_REDUCE_FUNCTION = function(memo, values){
      if (typeof memo !== "number" && typeof memo !== "undefined") {
        throw new Error("Memo was a [" + (typeof memo) + "].");
      }
      return (memo || 0) + values.length;
    }.toString();

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
      mapFunction: LINECOUNT_MAP_FUNCTION,
      reduceFunction: NUMBER_MEMO_VERIFYING_REDUCE_FUNCTION
    });
  });

  it('should pass the correct memo type to the reducer function (trying with string)', function(done) {

    var STRING_MEMO_VERIFYING_REDUCE_FUNCTION = function(memo, values) {
      if (typeof memo !== "string" && typeof memo !== "undefined") {
        throw new Error("Memo was a [" + (typeof memo) + "].");
      }
      var x = (memo || "");
      values.forEach(function(v) { x += v; });
      return x;
    }.toString();

    appServer.controllerClient.on('job:updated', function(data) {

      if (data.status === 'COMPLETED') {
        expect(data.result.count).to.eql('1111111111111111111111111');
        done();
      } else if (data.status === 'ERROR') {
        done(new Error('Job errored: ' + data.error));
      }
    });

    appServer.controllerClient.emit('frontend:register');
    appServer.controllerClient.emit('job:new', {
      inputUrl: gettysburgUrl,
      mapFunction: LINECOUNT_MAP_FUNCTION,
      reduceFunction: STRING_MEMO_VERIFYING_REDUCE_FUNCTION
    });
  });

  it('errors if the map function does not return an object', function(done) {

    var STRING_RETURNING_MAP_FUNCTION = function(line) {
      return "foo";
    }.toString();

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
      mapFunction: STRING_RETURNING_MAP_FUNCTION,
      reduceFunction: UNIMPORTANT_REDUCE_FUNCTION
    });
  });

  it('errors if the map function returns an Array', function(done) {

    var ARRAY_RETURNING_MAP_FUNCTION = function(line) {
      return ["foo"];
    }.toString();

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
      mapFunction: ARRAY_RETURNING_MAP_FUNCTION,
      reduceFunction: UNIMPORTANT_REDUCE_FUNCTION
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
