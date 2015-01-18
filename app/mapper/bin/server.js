var MapperApp = require('../classes/MapperApp');
var maybeController = process.argv[2];
var mapperApp = new MapperApp(process.env.PORT).start();

if (maybeController) {
  // TODO: replace timeout with warmup detection (retry on error)
  // Allow time for controller to warm up
  setTimeout(function() {
    mapperApp.discover(maybeController);
  }, 1000);
}
