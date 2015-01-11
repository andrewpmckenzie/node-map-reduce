module.exports = function(grunt) {

  grunt.config.merge({

    // https://github.com/ericclemmons/grunt-express-server
    express: {
      controllerServer: {
        options: {
          script: 'app/controller/server/server.js',
          node_env: grunt.option('env') || 'development',
          port: grunt.option('port') || 0
        }
      }
    },

    // https://github.com/gruntjs/grunt-contrib-watch
    watch: {
      options: {
        nospawn: true
      },

      controllerServerDev: {
        files: [ 'app/controller/**/*' ],
        tasks: [ 'express:controllerServer' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask('controller:start', ['express:controllerServer', 'watch:controllerServerDev']);
};
