module.exports = function(grunt) {

  grunt.config.merge({

    // https://github.com/ericclemmons/grunt-express-server
    express: {
      partitionerServer: {
        options: {
          script: 'app/partitioner/bin/server.js',
          node_env: grunt.option('env') || 'development',
          port: grunt.option('port') || 0,
          args: [
            grunt.option('controller') || null
          ]
        }
      }
    },

    // https://github.com/gruntjs/grunt-contrib-watch
    watch: {
      options: {
        nospawn: true
      },

      partitionerServerDev: {
        files: [ 'app/**/*' ],
        tasks: [ 'express:partitionerServer' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask('partitioner:start', ['express:partitionerServer', 'watch:partitionerServerDev']);
};
