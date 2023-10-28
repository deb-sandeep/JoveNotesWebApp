testPaperApp.controller( 'ExerciseListController', function( $scope, $http, $routeParams, $location, $window ) {
    // ---------------- Constants and inner class definition -----------------------
    function FilterCriteria() {

        this.levelFilters      = [ "NS", "L0" ] ;
        this.numAttemptFilter  = "0" ;

        this.serialize = function() {
            $.cookie.json = true ;
            $.cookie( 'exListCriteria', this, { expires: 30 } ) ;
        }

        this.deserialize = function() {
            $.cookie.json = true ;
            const crit = $.cookie( 'exListCriteria' );
            if( typeof crit != 'undefined' ) {
                log.debug( "Deserialized exercise list filter criteria." ) ;
                this.levelFilters      = crit.levelFilters ;
                this.numAttemptFilters = crit.numAttemptFilters ;
            } ;
        }

        this.setDefaultCriteria = function() {
            this.levelFilters      = [ "NS", "L0" ] ;
            this.numAttemptFilters = "0" ;
        }
    }

    // ---------------- Local variables --------------------------------------------

    // ---------------- Controller variables ---------------------------------------
    $scope.showFilterForm = false ;
    $scope.filterCriteria = new FilterCriteria() ;
    $scope.filterOptions  = new ExerciseFilterOptions() ;

    $scope.filteredQuestions = [] ;

    $scope.showMode = 'listing' ;
    $scope.currentQuestion = null ;
    $scope.totalAttemptTime = 0 ;
    $scope.totalScoreEarned = 0 ;
    $scope.numQuestionsAnswered = 0 ;

    $scope.exDetail = {
        exerciseSessionId : 0,
        chapterSessionId : 0,
        exerciseQuestionMappingId : 0,
        exerciseStartTime : 0,
        pauseStartTime : 0,
        totalPauseTime : 0,
        attemptDuration : 0
    }

    // ---------------- Main logic for the controller ------------------------------
    {
        log.debug( "Executing ExerciseListController." ) ;
        $scope.filterCriteria.deserialize() ;
        $scope.$parent.fetchAndProcessSelectedExerciseBanksFromServer( filterCards ) ;
    }

    // ---------------- Controller methods -----------------------------------------
    $scope.toggleFilterForm = function() {
        $scope.showFilterForm = !$scope.showFilterForm ;
    }

    $scope.applyFilter = function() {
        $scope.filterCriteria.serialize() ;
        $scope.toggleFilterForm() ;
        filterCards() ;
    }

    $scope.cancelFilter = function() {
        $scope.showFilterForm = false ;
        $scope.filterCriteria.deserialize() ;
    }

    $scope.questionNumber = function( question ) {
        let index = question.answer.indexOf( "Chapter:" ) ;
        if( index != -1 ) {
            return question.answer.substring( index ) ;
        }
        return "" ;
    }

    $scope.startExercise = function( question ) {
        $scope.currentQuestion = question ;
        $scope.currentQuestion._attemptedInThisListing = false ;

        callExerciseAPIToCreateNewSession( function(){
            $scope.exDetail.exerciseStartTime = new Date().getTime() ;
            $scope.exDetail.pauseStartTime = 0 ;
            $scope.exDetail.totalPauseTime = 0 ;
            $scope.exDetail.attemptDuration = 0 ;
            $scope.showMode = 'exercise' ;
            setTimeout( handleTimerEvent, 1000 ) ;
        }) ;
    }

    $scope.promoteQuestion = function( question ) {
        promoteCard( question ) ;
    }

    $scope.endExercise = function( rating ) {
        if( rating === 'abort' ) {
            console.log( "Aborting exerise" ) ;
            switchToListingMode() ;
        }
        else {
            console.log( "Rating exercise" ) ;
            rateCard( rating, switchToListingMode ) ;
        }
    }

    $scope.pauseExercise = function() {
        $( '#modalResume' ).modal( 'show' ) ;
        $scope.exDetail.pauseStartTime = new Date().getTime() ;
    }

    $scope.resumeExercise = function() {
        $scope.exDetail.totalPauseTime += new Date().getTime() - $scope.exDetail.pauseStartTime ;
        $scope.exDetail.pauseStartTime = 0 ;
        $( '#modalResume' ).modal( 'hide' ) ;
    }

    // ---------------- Private functions ------------------------------------------
    function switchToListingMode() {
        $scope.showMode = 'listing' ;
        $scope.currentQuestion = null ;

        $scope.exDetail.exerciseSessionId = 0 ;
        $scope.exDetail.chapterSessionId = 0 ;
        $scope.exDetail.exerciseQuestionMappingId = 0 ;
        $scope.exDetail.exerciseStartTime = 0 ;
        $scope.exDetail.pauseStartTime = 0 ;
        $scope.exDetail.totalPauseTime = 0 ;
        $scope.exDetail.attemptDuration = 0 ;

        filterCards() ;
    }

    function filterCards() {
        $scope.filteredQuestions.length = 0 ;

        for( let i=0; i<$scope.$parent.exerciseBanks[0].questions.length; i++ ) {

            const question = $scope.$parent.exerciseBanks[0].questions[i];
            const curLevel = question.learningStats.currentLevel;
            const numAttempts = question.learningStats.numAttempts;

            if( !question._attemptedInThisListing ) {
                for( let j=0; j<$scope.filterCriteria.levelFilters.length; j++ ) {
                    if( $scope.filterCriteria.levelFilters[j] == curLevel ) {
                        if( numAttempts >= $scope.filterCriteria.numAttemptFilter ) {
                            $scope.filteredQuestions.push( question ) ;
                        }
                    }
                }
            }
        }
    }

    function handleTimerEvent() {
        if( $scope.showMode === 'exercise' ) {
            if( $scope.exDetail.pauseStartTime === 0 ) {
                refreshClocks() ;
                setTimeout( handleTimerEvent, 1000 ) ;
            }
            else {
                setTimeout( handleTimerEvent, 500 ) ;
            }
        }
    }

    function refreshClocks() {
        if( $scope.exDetail.pauseStartTime !== 0 ) {
            $scope.exDetail.totalPauseTime =
                new Date().getTime() - $scope.exDetail.pauseStartTime ;
        }

        let timeForCurrentQuestion =
            new Date().getTime() - $scope.exDetail.exerciseStartTime
                                 - $scope.exDetail.totalPauseTime ;

        $scope.exDetail.attemptDuration = Math.ceil( timeForCurrentQuestion ) ;
        $scope.$digest() ;
    }

    function rateCard( rating, callback ) {

        log.debug( "Rating current card as " + rating ) ;
        let question = $scope.currentQuestion ;

        const cardId       = question.questionId;
        const chapterId    = question._chapterDetails.chapterId;
        const curLevel     = question.learningStats.currentLevel;
        const numAttempts  = question.learningStats.numAttempts + 1 ;
        const timeSpent    = Math.ceil( $scope.exDetail.attemptDuration / 1000 );
        const nextLevel    = getNextLevel( curLevel, rating );
        const overshootPct = 0;
        const chSessionId  = $scope.exDetail.chapterSessionId ;

        callGradeCardAPI(
            question,
            chapterId,
            chSessionId,
            cardId,
            curLevel,
            nextLevel,
            rating,
            timeSpent,
            numAttempts,
            overshootPct,
            0,
            callback
        ) ;
    }

    function getNextLevel( curLevel, rating ) {

        const nextLevelMatrix = {
            //       E      A     P     H
            NS: ['MAS', 'L0', 'L0', 'L0'],
            L0: ['MAS', 'L0', 'L0', 'L0'],
            L1: ['MAS', 'L1', 'L0', 'L0'],
        };

        const nextLevels = nextLevelMatrix[curLevel];
        if      ( rating == 'E' ) { return nextLevels[0] ; }
        else if ( rating == 'A' ) { return nextLevels[1] ; }
        else if ( rating == 'P' ) { return nextLevels[2] ; }
        else if ( rating == 'H' ) { return nextLevels[3] ; }
    }

    // ---------------- Server calls -----------------------------------------------
    function promoteCard( question ) {

        const cardId       = question.questionId;
        const chapterId    = question._chapterDetails.chapterId;

        console.log( "Calling Exercise API for promoting card." ) ;
        $http.post( '/jove_notes/api/Exercise/PromoteCard', {
            "chapterId" : chapterId,
            "cardId" : cardId
        })
        .success( function( data ){
            question._attemptedInThisListing = true ;
            filterCards() ;
        })
        .error( function( data, status ){
            $scope.addErrorAlert( "Exercise::PromoteCard API call failed. " +
                "Status = " + status + ", " +
                "Response = " + data ) ;
        }) ;
    }

    function callExerciseAPIToCreateNewSession( callback ) {

        console.log( "Calling Exercise API for creating new session." ) ;
        $http.post( '/jove_notes/api/Exercise/NewSession', {
            "chapterIds" : [$scope.currentQuestion._chapterDetails.chapterId]
        })
        .success( function( data ){
            if( typeof data === 'string' ) {
                $scope.addErrorAlert( "Exercise::NewSession API call failed. " +
                                      "Server says - " + data ) ;
            }
            else {
                createExerciseQuestionMappingOnServer( data, callback ) ;
            }
        })
        .error( function( data, status ){
            $scope.addErrorAlert( "Exercise::NewSession API call failed. " +
                                  "Status = " + status + ", " +
                                  "Response = " + data ) ;
        }) ;
    }

    function createExerciseQuestionMappingOnServer( newSessionData, callback ) {

        let chapterId = $scope.currentQuestion._chapterDetails.chapterId ;

        $scope.exDetail.exerciseSessionId = newSessionData.sessionId ;
        $scope.exDetail.chapterSessionId = newSessionData.exChapterSessionIdMap[ chapterId ] ;

        console.log( "Creating exercise question entries on server." ) ;

        $http.post( '/jove_notes/api/ExerciseQuestion', {
            "sessionId" : $scope.exDetail.exerciseSessionId,
            "questionIds" : [$scope.currentQuestion.questionId]
        })
        .success( function( data ) {
            console.log( "ExerciseQuestion map created on server." ) ;
            console.log( data ) ;
            $scope.exDetail.exerciseQuestionMappingId = data[0].exMappingId ;
            callback() ;
        })
        .error( function( data, status ){
            $scope.addErrorAlert( "ExerciseQuestion mapping API call failed. " +
                "Status = " + status + ", " +
                "Response = " + data ) ;
        }) ;
    }

    function callGradeCardAPI( question, chapterId, sessionId, cardId, curLevel, nextLevel,
                               rating, timeTaken, numAttempts, overshootPct,
                               previousCallAttemptNumber, callback ) {

        const currentCallAttemptNumber = previousCallAttemptNumber + 1;

        $http.post( '/jove_notes/api/GradeCard', {
            "chapterId"           : chapterId,
            "sessionId"           : sessionId,
            "cardId"              : cardId,
            "currentLevel"        : curLevel,
            "nextLevel"           : nextLevel,
            "rating"              : rating,
            "timeTaken"           : timeTaken,
            "numAttempts"         : numAttempts,
            "overshootPct"        : overshootPct,
            "skipNegativeGrading" : false
        })
        .success( function( data ){
            if( typeof data === 'string' ) {
                $scope.addErrorAlert( "Grade Card API call failed. No score " +
                                      "returned. Server says - " + data ) ;
            }
            else {
                log.debug( "Grading of card " + cardId + " success." ) ;
                log.debug( "Score earned = " + data.score ) ;
                $scope.totalAttemptTime += $scope.exDetail.attemptDuration ;
                $scope.totalScoreEarned += data.score ;
                $scope.numQuestionsAnswered++ ;

                $scope.currentQuestion.learningStats.currentLevel = nextLevel ;
                $scope.currentQuestion.learningStats.numAttempts = numAttempts ;
                $scope.currentQuestion._attemptedInThisListing = true ;
                callback() ;
            }
        })
        .error( function( data, status ){

            if( status == 0 ) {
                log.debug( "Faulty connection determined." ) ;

                if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                    log.debug( "Retrying the call again." ) ;
                    callGradeCardAPI(
                        question, chapterId, sessionId, cardId, curLevel, nextLevel,
                        rating, timeTaken, numAttempts, overshootPct,
                        currentCallAttemptNumber, callback
                    ) ;
                    return ;
                }
                log.debug( "Number of retries exceeded. Notifying the user." ) ;
            }

            $scope.addErrorAlert( "Grade Card API call failed. " +
                "Status = " + status + ", " +
                "Response = " + data ) ;
        }) ;
    }
    // ---------------- Server response processors ---------------------------------

    // ---------------- End of controller ------------------------------------------
} ) ;
