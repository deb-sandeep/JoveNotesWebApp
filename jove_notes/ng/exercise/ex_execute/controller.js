testPaperApp.controller( 'ExerciseExecutionController', 
                         function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.showCreatingSessionScreen = true ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseExecutionController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }

    $scope.$parent.pageTitle = "Exercise" ;

    // Create a new session at the server. Note that exercise sessions are 
    // different than learning sessions as exercise sessions can contain more
    // than one chapter's learning sessions.
    callExerciseAPIToCreateNewSession( $scope.$parent.getChapterIdsForExercise(), 
                                       0, postSessionCreation ) ;
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------
function checkInvalidLoad() {
    if( $scope.$parent.getTotalSelCards( 'Total' ) <= 0 ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

function postSessionCreation( newSessionData ) {
    // $scope.showCreatingSessionScreen = false ;
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