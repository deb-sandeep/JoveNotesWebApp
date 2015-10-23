var dashboardApp = angular.module( 'dashboardApp', [ 'ngRoute', 'ui.bootstrap', 'ngSanitize' ] ) ;

dashboardApp.config(['$routeProvider',

    function( $routeProvider ) {

        $routeProvider
        .when('/ProgressSnapshot', {
            templateUrl: '/apps/jove_notes/ng/dashboard/progress_snapshot/main.html',
            controller:  'ProgressSnapshotController'
        })
        .when('/Reports', {
            templateUrl: '/apps/jove_notes/ng/dashboard/reports/main.html',
            controller: 'ReportsController'
        })
        .when('/Pivots', {
            templateUrl: '/apps/jove_notes/ng/dashboard/pivots/main.html',
            controller: 'PivotsController'
        })
        .when('/Review', {
            templateUrl: '/apps/jove_notes/ng/dashboard/notes_review/main.html',
            controller: 'NotesReviewController'
        })
        .when('/ChapterProgressSnapshot/:chapterId', {
            templateUrl: '/apps/jove_notes/ng/dashboard/chapter_progress_snapshot/main.html',
            controller: 'ChapterProgressSnapshotController'
        })
        .otherwise({
            redirectTo: '/ProgressSnapshot'
        });
    }
]);
