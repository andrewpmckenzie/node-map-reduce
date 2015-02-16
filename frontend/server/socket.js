Meteor.startup(function () {
  var controllerSocket = null;
  var partitionerSockets = [];
  var reducerSockets = [];
  var mapperSockets = [];

  var addOrUpdateJob = function (jobDetails, serverType, address) {
    var jobId = jobDetails.id;
    var id = serverType + ':' + address + ':' + jobId;
    var payload = {
      id: id,
      jobId: jobId,
      serverType: serverType,
      address: address,
      details: jobDetails
    };

    if (Jobs.findOne({id: id})) {
      Jobs.update({id: id}, {$set: payload});
    } else {
      Jobs.insert(payload);
    }
  };

  var registerMapper = function (info) {
    var socket = io(info.address);
    socket.on('connect', Meteor.bindEnvironment(function () {
      socket.on('job:updated', Meteor.bindEnvironment(function (job) { addOrUpdateJob(job, 'mapper', info.address); }));
      socket.emit('frontend:register');
    }));
    mapperSockets.push(socket);
  };

  var registerPartitioner = function (info) {
    var socket = io(info.address);
    socket.on('connect', Meteor.bindEnvironment(function () {
      socket.on('job:updated', Meteor.bindEnvironment(function (job) { addOrUpdateJob(job, 'partitioner', info.address); }));
      socket.emit('frontend:register');
    }));
    partitionerSockets.push(socket);
  };

  var registerReducer = function (info) {
    var socket = io(info.address);
    socket.on('connect', Meteor.bindEnvironment(function () {
      socket.on('job:updated', Meteor.bindEnvironment(function (job) { addOrUpdateJob(job, 'reducer', info.address); }));
      socket.emit('frontend:register');
    }));
    reducerSockets.push(socket);
  };

  var registerController = function (address) {
    controllerSocket = io(address);
    controllerSocket.on('connect', Meteor.bindEnvironment(function () {
      controllerSocket.on('job:added', Meteor.bindEnvironment(function (job) { addOrUpdateJob(job, 'controller', '-'); }));
      controllerSocket.on('job:updated', Meteor.bindEnvironment(function (job) { addOrUpdateJob(job, 'controller', '-'); }));
      controllerSocket.on('mapper:registered', Meteor.bindEnvironment(registerMapper));
      controllerSocket.on('partitioner:registered', Meteor.bindEnvironment(registerPartitioner));
      controllerSocket.on('reducer:registered', Meteor.bindEnvironment(registerReducer));
      controllerSocket.emit('frontend:register');
    }));
  };

  registerController('http://localhost:3010');
});
