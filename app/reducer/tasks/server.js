module.exports = function(grunt) {

  grunt.config.merge({

    // https://github.com/ericclemmons/grunt-express-server
    express: {
      reducerServer: {
        options: {
          script: 'app/reducer/bin/server.js',
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

      reducerServerDev: {
        files: [ 'app/**/*' ],
        tasks: [ 'express:reducerServer' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask('reducer:start', ['express:reducerServer', 'watch:reducerServerDev']);
};
