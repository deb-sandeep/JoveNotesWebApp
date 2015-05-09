// Karma configuration
// Generated on Mon May 04 2015 16:38:27 GMT+0530 (IST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/angular/angular.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/angular/angular-route.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/angular/angular-sanitize.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/angular/angular-resource.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/jquery/jquery-2.1.1.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/jquery/jquery.cookie.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/jquery-ui/1.11.4/jquery-ui.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/jquery/jquery.treegrid.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/jquery/jquery.treegrid.bootstrap3.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/bootstrap-3.3.4/js/bootstrap.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/bootstrap-3.3.4/angular/ui-bootstrap-custom-0.12.1.min.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/log4javascript/log4javascript.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/rgraph/RGraph.bar.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/rgraph/RGraph.common.core.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/rgraph/RGraph.common.key.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/rgraph/RGraph.line.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/rgraph/RGraph.pie.js',
      '/home/sandeep/projects/source/PHPAppFramework/lib-ext/dombuilder/DOMBuilder.min.js',

      '/home/sandeep/projects/source/PHPWebApps/_common/scripts/common_utils.js',

      '/usr/local/lib/node_modules/angular-mocks/angular-mocks.js',
      '/usr/local/lib/node_modules/jasmine-core/lib/jasmine-jquery.js',

      'ng/_common/jove_notes_utils.js',
      'ng/_common/question_utils.js',
      'ng/_common/question_handlers.js',
    
      'ng/dashboard/routes.js',
      'ng/dashboard/controllers.js',
      'ng/dashboard/directives.js',
      'ng/dashboard/chapter_progress_snapshot/controllers.js',
      'ng/dashboard/progress_snapshot/controllers.js',
      'ng/dashboard/study_per_day/controllers.js',

      'ng/flashcard/routes.js',
      'ng/flashcard/filters.js',
      'ng/flashcard/directives.js',
      'ng/flashcard/controllers.js',
      'ng/flashcard/end_page/controllers.js',
      'ng/flashcard/practice_page/controllers.js',
      'ng/flashcard/start_page/controllers.js',

      'ng/notes/routes.js',
      'ng/notes/filters.js',
      'ng/notes/controllers.js',

      'ng_test/bootstrap.js',
      'ng_test/custom_matchers.js',
      'ng_test/**/*.js',

      { 
        pattern: 'api_test_data/**/*.json',
        watched: true,
        served:  true,
        included: false
      }
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
