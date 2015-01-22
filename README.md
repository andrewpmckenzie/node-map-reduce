# node-map-reduce

A simple distributed map reduce system using node + javascript. It works (on localhost at least), but be warned -
it is really slow. Only transfer of strings as map values, and reduce memos are supported at the moment.

To run locally: `npm start`

To run a controller: `grunt controller:start --port PORT_NUMBER`

To run a mapper: `grunt mapper:start --port PORT_NUMBER --controller http://CONTROLLER_ADDRESS:CONTROLLER_PORT`

To run a reducer: `grunt reducer:start --port PORT_NUMBER --controller http://CONTROLLER_ADDRESS:CONTROLLER_PORT`

To run a partitioner: `grunt partitioner:start --port PORT_NUMBER --controller http://CONTROLLER_ADDRESS:CONTROLLER_PORT`

To make a request:

    POST to http://CONTROLLER_ADDRESS:CONTROLLER_PORT/job/new

        inputUrl=http://inputfile.com/path/to/input.txt
        reduceFunction=function(memo, values){ return FOLDED_VALUES; }
        mapFunction=function(line) { return {KEY:[VALUE1,VALUE2], KEY2:[VALUE3]}; }
