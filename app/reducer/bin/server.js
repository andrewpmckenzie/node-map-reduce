var ReducerApp = require('../classes/ReducerApp');

var reducerApp = new ReducerApp(process.env.PORT, process.argv[2]).start();
