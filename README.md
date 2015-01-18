# node-map-reduce

Work in progress.

The plan is to create a simple distributed map reduce system using node + javascript.

To run locally: `npm start`

To run a controller: `grunt controller:start --port PORT_NUMBER`

To run a mapper: `grunt mapper:start --port PORT_NUMBER --controller http://CONTROLLER_ADDRESS:CONTROLLER_PORT`

To make a request:

    POST to http://CONTROLLER_ADDRESS:CONTROLLER_PORT/job/new

        inputUrl=http://inputfile.com/path/to/input.txt
        reduceFunction=function(key, values){ return RESULT_FOR_KEY; }
        mapFunction=function(line) { return {KEY:[VALUE1,VALUE2], KEY2:[VALUE3]}; }
