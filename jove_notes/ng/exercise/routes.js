var testPaperApp = angular.module( 'exerciseApp', [ 'ngRoute', 'ui.bootstrap', 'ngSanitize' ] ) ;

testPaperApp.config( [ '$routeProvider',

    function( $routeProvider ) {

        $routeProvider
        .when('/ConfigureExercise', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_configure/main.html',
            controller:  'ExerciseConfigController'
        })
        .when('/StudyExercise', {
            templateUrl: '/apps/jove_notes/ng/exercise/ex_study/main.html',
            controller: 'ExerciseStudyController'
        })
        .when('/AttemptQuestion', {
            templateUrl: '/apps/jove_notes/ng/exercise/q_attempt/main.html',
            controller: 'ExerciseQuestionAttemptController'
        })
        .when('/ReviewQuestion', {
            templateUrl: '/apps/jove_notes/ng/exercise/q_review/main.html',
            controller: 'ExerciseQuestionReviewController'
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
