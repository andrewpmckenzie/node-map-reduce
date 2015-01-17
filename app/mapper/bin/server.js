var MapperApp = require('../classes/MapperApp');
var maybeController = process.argv[2];
var mapperApp = new MapperApp(process.env.PORT).start();

if (maybeController) {
  mapperApp.discover(maybeController);
}
