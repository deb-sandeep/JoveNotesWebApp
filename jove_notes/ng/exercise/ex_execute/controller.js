testPaperApp.controller( 'ExerciseExecutionController', 
                         function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.CREATING_SESSION_SCREEN = "CreatingSessionScreen" ;
$scope.STUDY_QUESTIONS_SCREEN  = "StudyQuestionsScreen" ;

$scope.currentScreen = $scope.CREATING_SESSION_SCREEN ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseExecutionController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }

    $scope.$parent.pageTitle = "Exercise" ;

    pruneUnusedExerciseBanks() ;
    filterQuestionsForSession() ;

    // Create a new session at the server. Note that exercise sessions are 
    // different than learning sessions as exercise sessions can contain more
    // than one chapter's learning sessions.
    callExerciseAPIToCreateNewSession( $scope.$parent.getChapterIdsForExercise(), 
                                       0, postSessionCreation ) ;
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------
function postSessionCreation( newSessionData ) {
    
    $scope.$parent.exerciseSessionId = newSessionData.sessionId ;
    for( var key in newSessionData.exChapterSessionIdMap ) {
        $scope.$parent.exerciseBanksMap[ key ]._sessionId = 
                                   newSessionData.exChapterSessionIdMap[ key ] ;
    }
    $scope.currentScreen = $scope.STUDY_QUESTIONS_SCREEN ;
    $scope.$parent.startTimer() ;
}

function pruneUnusedExerciseBanks() {

    var prunedExBanks    = [] ;
    var prunedExBanksMap = [] ;

    for( var i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {
        var ex = $scope.exerciseBanks[i] ;
        if( $scope.$parent.getSelectedCardsForExercise( ex ) > 0 ) {
            prunedExBanks.push( ex ) ;
            prunedExBanksMap[ ex.chapterDetails.chapterId ] = ex ;
        }
    }

    $scope.$parent.exerciseBanks    = prunedExBanks ;
    $scope.$parent.exerciseBanksMap = prunedExBanksMap ;
}

function filterQuestionsForSession() {

    var exQuestions = [] ;

    for( var i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {

        var ex                   = $scope.exerciseBanks[i] ;
        var categorizedQuestions = categorizeQuestions( ex ) ;
        var filteredQuestions    = [] ;

        if( ex._selCfg.ssr.numNSCards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.nsQuestions, 
                                                 ex._selCfg.ssr.numNSCards,
                                                 ex._selCfg.ssr.strategyNS ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.ssr.numL0Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.l0Questions, 
                                                 ex._selCfg.ssr.numL0Cards,
                                                 ex._selCfg.ssr.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.ssr.numL1Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.l1Questions, 
                                                 ex._selCfg.ssr.numL1Cards,
                                                 ex._selCfg.ssr.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.nonSSR.numL0Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.nonSSR.l0Questions, 
                                                 ex._selCfg.nonSSR.numL0Cards,
                                                 ex._selCfg.nonSSR.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.nonSSR.numL1Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.nonSSR.l1Questions, 
                                                 ex._selCfg.nonSSR.numL1Cards,
                                                 ex._selCfg.nonSSR.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }
    }

    $scope.$parent.questions = exQuestions ;
}

function categorizeQuestions( exercise ) {

    var categorizedQuestions = {
        ssr : {
            nsQuestions : [],
            l0Questions : [],
            l1Questions : []
        },
        nonSSR : {
            l0Questions : [],
            l1Questions : []
        }
    } ;

    for( var i=0; i<exercise.questions.length; i++ ) {
        var q = exercise.questions[i] ;
        if( q.learningStats._ssrQualified ) {
            if( q.learningStats.currentLevel == 'NS' ) {
                categorizedQuestions.ssr.nsQuestions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L0' ) {
                categorizedQuestions.ssr.l0Questions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L1' ) {
                categorizedQuestions.ssr.l1Questions.push( q ) ;
            }
        }
        else {
            if( q.learningStats.currentLevel == 'L0' ) {
                categorizedQuestions.nonSSR.l0Questions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L1' ) {
                categorizedQuestions.nonSSR.l1Questions.push( q ) ;
            }
        }
    }

    return categorizedQuestions ;
}

function filterQuestions( questions, numQuestions, strategy ) {

    var filteredQuestions = [] ;

    if( strategy == 'Hard' ) {
        questions.sort( function( q1, q2 ){
            return -1*( q1.learningStats._absoluteLearningEfficiency - 
                        q2.learningStats._absoluteLearningEfficiency ) ;
        }) ;
    }
    else if( strategy == 'Age' ) {
        questions.sort( function( q1, q2 ){
            return ( q1.learningStats.lastAttemptTime - 
                     q2.learningStats.lastAttemptTime ) ;
        }) ;
    }

    for( var i=0; i<numQuestions; i++ ) {
        filteredQuestions.push( questions[i] ) ;
    }

    return filteredQuestions ;
}

function checkInvalidLoad() {
    if( $scope.$parent.exerciseBanks.length <= 0 ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

// ---------------- Server calls -----------------------------------------------
/**
 * This function calls on the ExerciseAPI to create a new exercise session.
 *
 * NOTE: This call is recursive! Why? There are times when the API invocation
 * is gracefully disconnected by the server (HTTP??) resulting in a return
 * status code of 0 and data null. In such cases the server code doesn't even
 * receive the request (verified through logs.)
 *   Under such cases, (only if status code is 0), this function calls upon 
 * itself to retry the call. The retrial will continue for the configured max
 * number of times. If all the retrial attempts fail, an alert will be 
 * displayed to the user.
 *
 * @param chapterIds - An array of chapter ids which are included in this exercise
 */
function callExerciseAPIToCreateNewSession( chapterIds, 
                                            previousCallAttemptNumber,
                                            callback ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    log.debug( "Calling Exercise API for creating new session." ) ;
    log.debug( "\tchapterIds   = " + chapterIds.join()   ) ;

    $http.post( '/jove_notes/api/Exercise/NewSession', { 
        "chapterIds"   : chapterIds
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "Exercise::NewSession API call failed. " + 
                                  "Server says - " + data ) ;
        }
        else {
            log.debug( "New Session created." ) ;
            callback( data ) ;
        }
    })
    .error( function( data, status ){

        if( status == 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                log.debug( "Retrying the call again." ) ;
                callExerciseAPIToCreateNewSession( 
                    chapterIds, currentCallAttemptNumber 
                ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        $scope.addErrorAlert( "Exercise::NewSession API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + data ) ;
    }) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;