module.exports = function(grunt) {

  grunt.config.merge({

    // https://github.com/ericclemmons/grunt-express-server
    express: {
      mapperServer: {
        options: {
          script: 'app/mapper/bin/server.js',
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

      mapperServerDev: {
        files: [ 'app/mapper/**/*' ],
        tasks: [ 'express:mapperServer' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask('mapper:start', ['express:mapperServer', 'watch:mapperServerDev']);
};
