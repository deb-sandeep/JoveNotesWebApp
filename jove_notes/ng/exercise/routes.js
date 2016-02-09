var testPaperApp = angular.module( 'exerciseApp', [ 'ngRoute', 'ui.bootstrap', 'ngSanitize' ] ) ;

testPaperApp.config( [ '$routeProvider',

    function( $routeProvider ) {

        $routeProvider
        .when('/ConfigureExercise', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_configure/main.html',
            controller:  'ExerciseConfigController'
        })
        .when('/ExecuteExercise', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_execute/main.html',
            controller: 'ExerciseExecutionController'
        })
        .when('/EvaluateExercise', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_evaluate/main.html',
            controller: 'ExerciseEvaluationController'
        })
        .when('/ExerciseSummary', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_summary/main.html',
            controller: 'ExerciseSummaryController'
        })
        .otherwise({
            redirectTo: '/ConfigureExercise'
        }) ;
    }
]);
