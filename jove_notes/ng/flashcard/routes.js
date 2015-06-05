var flashCardApp = angular.module( 'flashCardApp', [ 'ngRoute', 'ui.bootstrap', 'ngSanitize' ] ) ;

flashCardApp.config( [ '$routeProvider',

    function( $routeProvider ) {

        $routeProvider
        .when('/StartPage', {
            templateUrl: '/apps/jove_notes/ng/flashcard/start_page/main.html',
            controller:  'StartPageController'
        })
        .when('/EndPage', {
            templateUrl: '/apps/jove_notes/ng/flashcard/end_page/main.html',
            controller: 'EndPageController'
        })
        .when('/PracticePage', {
            templateUrl: '/apps/jove_notes/ng/flashcard/practice_page/main.html',
            controller: 'PracticePageController'
        })
        .otherwise({
            redirectTo: '/StartPage'
        }) ;
    }
]);
