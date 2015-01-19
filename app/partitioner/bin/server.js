var PartitionerApp = require('../classes/PartitionerApp');

var partitionerApp = new PartitionerApp(process.env.PORT, process.argv[2]).start();
