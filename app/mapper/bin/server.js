var MapperApp = require('../classes/MapperApp');

var mapperApp = new MapperApp(process.env.PORT, process.argv[2]).start();
