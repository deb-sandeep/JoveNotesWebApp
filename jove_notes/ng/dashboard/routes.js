var dashboardApp = angular.module( 'dashboardApp', [ 'ngRoute', 'ui.bootstrap' ] ) ;

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
        .when('/ChapterProgressSnapshot/:chapterId', {
            templateUrl: '/apps/jove_notes/ng/dashboard/chapter_progress_snapshot/main.html',
            controller: 'ChapterProgressSnapshotController'
        })
        .otherwise({
            redirectTo: '/ProgressSnapshot'
        });
    }
]);
