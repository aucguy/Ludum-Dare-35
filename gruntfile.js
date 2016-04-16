module.exports = function(grunt) {
  grunt.initConfig({
    subgrunt: {
      lib: {
        'lib/basejs': ['build', '--injectors=phaser'],
        'lib/canvg': 'build',
        'lib/javascript-state-machine': 'build',
        'lib/phaser': 'full'
      }
    },
    concat: {
      main: {
        src: ['src/*.js', '!src/base.js', '!src/index.js'],
        dest: 'build/mainConcat.js'
      },
      app: {
        src: ['lib/basejs/build/baseinjectors.min.js',
              'lib/canvg/canvg.min.js',
              'lib/javascript-state-machine/state-machine.min.js',
              'lib/phaser/build/phaser.min.js',
              'build/mainUglify.min.js'],
        dest: 'build/appConcat.min.js'
      },
      bootstrap: {
        src: ['build/indexUglify.min.js', 'lib/basejs/build/base.min.js'],
        dest: 'build/bootstrapConcat.min.js'
      }
    },
    uglify: {
      main: {
        src: 'build/mainConcat.js',
        dest: 'build/mainUglify.min.js'
      },
      index: {
        src: 'build/indexPreprocessed.js',
        dest: 'build/indexUglify.min.js'
      }
    },
    copy: {
      scripts: {
        files: {
            'build/release/app.min.js': 'build/appConcat.min.js',
            'build/release/bootstrap.min.js': 'build/bootstrapConcat.min.js',
            'build/release/index.html': 'build/entryPreprocessed.html'
        }
      },
      assets: {
          src: 'assets/**',
          dest: 'build/release/'
        },
    },
    preprocess: {
      index: {
        src: 'src/index.js',
        dest: 'build/indexPreprocessed.js'
      },
      entry: {
        src: 'index.html',
        dest: 'build/entryPreprocessed.html'
      }
    }
  });
  grunt.loadNpmTasks('grunt-subgrunt');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  var MODES = {
    NONE: 0,
    DEV: 1,
    REL: 2
  };

  grunt.task.registerMultiTask('preprocess', 'Preprocessor', function() {
    var lines = grunt.file.read(this.data.src).toString().split('\n');
    var output = [];
    var mode = MODES.NONE;

    for(var lineno=0; lineno<lines.length; lineno++) {
      var line = lines[lineno].trimRight();

      if(line.trimLeft().startsWith('//#')) {
        var macro = line.trimLeft().slice(3).split(' ');
        if(macro[0] == 'mode') {
          if(macro[1] == 'none') mode = MODES.NONE;
          else if(macro[1] == 'dev') mode = MODES.DEV;
          else if(macro[1] == 'rel') mode = MODES.REL;
          else throw(new Error('invalid mode at line ' + (lineno + 1)));
        }
        else throw(new Error('invalid macro at line' + (lineno + 1)));
      } else if(mode == MODES.NONE) {
        output.push(line);
      } else if(mode == MODES.REL) {
        output.push(line.trimLeft().slice(2));
      }
    }

    grunt.file.write(this.data.dest, output.join('\n'));
  });

  grunt.registerTask('build',[
    'subgrunt:lib',
    'concat:main',
    'uglify:main',
    'concat:app',
    'preprocess:index',
    'uglify:index',
    'concat:bootstrap',
    'preprocess:entry',
    'copy:scripts',
    'copy:assets',
    ]);
};
