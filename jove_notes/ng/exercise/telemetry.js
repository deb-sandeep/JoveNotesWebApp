function ExerciseTelemetry( $scope, $http ) {

    const UPDATE_SESSION_API = "/jove_notes/api/Exercise/UpdateSession" ;
    const EXERCISE_EVENT_API = "/jove_notes/api/ExerciseEvent" ;
    const UPDATE_QUESTION_API= "/jove_notes/api/ExerciseQuestion" ;

    const PRINT_LAST_ELEMENT = false ;
    const MAX_FAILED_PUBLISH_ATTEMPTS = 2 ;

    const eventQueue = [] ;
    const deadLetterQueue = [] ;

    function getUpdateSessionEvent() {
        let event = {
            'eventType' : 'UpdateSession',
            'failedPublishAttempts' : 0,
            'endpoint' : `${UPDATE_SESSION_API}/${$scope.exerciseSessionId}`,
            'payload' : {}
        } ;
        eventQueue.push( event ) ;
        return event ;
    }

    function getUpdateExerciseQuestionEvent( question ) {
        let event = {
            'eventType' : 'UpdateExQuestion',
            'failedPublishAttempts' : 0,
            'endpoint' : `${UPDATE_QUESTION_API}/${$scope.exerciseSessionId}/${question.questionId}`,
            'payload' : {}
        } ;
        eventQueue.push( event ) ;
        return event ;
    }

    this.printLastElementInQueue = function() {
        if( PRINT_LAST_ELEMENT ) {
            if( eventQueue.length > 0 )
                console.log( eventQueue[ eventQueue.length-1 ] ) ;
        }
    }

    this.printQueue = function() {
        eventQueue.forEach( e => console.log( e ) ) ;
    }

    this.logEvent = function( phaseName, eventName, eventType, question = null ) {

        const questionId = question == null ? -1 : question.questionId ;
        eventQueue.push( {
            'eventType' : 'MarkerEvent',
            'failedPublishAttempts' : 0,
            'endpoint' : EXERCISE_EVENT_API,
            'payload' : {
                'exerciseId' : $scope.exerciseSessionId,
                'timestamp'  : Date.now(),
                'phaseName'  : phaseName,
                'eventName'  : eventName,
                'eventType'  : eventType,
                'questionId' : questionId
            }
        } ) ;

        this.printLastElementInQueue() ;
    }

    this.updateSessionCompleted = function() {
        getUpdateSessionEvent().payload[ 'completed' ] = 1 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalSolveTime = function() {
        getUpdateSessionEvent().payload[ 'totalSolveTime' ] =
                            Math.round($scope.durationTillNowInMillis/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalPauseTime = function() {
        getUpdateSessionEvent().payload[ 'pauseTime' ] =
                                    Math.round($scope.totalPauseTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalReviewTime = function() {
        getUpdateSessionEvent().payload[ 'reviewTime' ] =
                                    Math.round($scope.totalReviewTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionStudyTime = function() {
        getUpdateSessionEvent().payload[ 'studyTime' ] =
                                    Math.round($scope.totalStudyTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalQuestions = function() {
        getUpdateSessionEvent().payload[ 'totalQuestions' ] = $scope.questions.length ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionNumCorrect = function( numCorrect ) {
        getUpdateSessionEvent().payload[ 'numCorrect' ] = numCorrect ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalMarks = function( totalMarks ) {
        getUpdateSessionEvent().payload[ 'totalMarks' ] = totalMarks ;
        this.printLastElementInQueue() ;
    }

    // ExerciseQuestion telemetry

    this.updateExQuestionTotalTimeTaken = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'totalTimeTaken' ] =
                        Math.round(question._sessionVars.timeSpent/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionNumAttempts = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'numAttempts' ] = question._sessionVars.numAttempts ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionStudyTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'studyTime' ] =
                        Math.round(question._sessionVars.studyTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionAttemptTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'attemptTime' ] =
                        Math.round(question._sessionVars.attemptTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionReviewTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'reviewTime' ] =
                        Math.round(question._sessionVars.reviewTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionPauseTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'pauseTime' ] =
                        Math.round(question._sessionVars.pauseTime/1000 ) ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionMarksObtained = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'marksObtained' ] = question._sessionVars.scoreEarned ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionResult = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'result' ] = question._sessionVars.rating ;
        this.printLastElementInQueue() ;
    }

    this.startServerPublishPump = function() {
        runPump() ;
    }

    // Publishing pump
    function runPump() {
        console.log( '.' ) ;
        if( eventQueue.length == 0 ) {
            setTimeout( runPump, 500 ) ;
        }
        else {
            const event = eventQueue.shift() ;

            if( event.eventType === 'MarkerEvent' ) {
                console.log( `Publishing event. Type = ${event.eventType}. Action ${event.action}` ) ;
            }
            else {
                console.log( `Publishing event. Type = ${event.eventType}` ) ;
                console.log( event ) ;
            }

            $http.post( event.endpoint, event.payload )
            .success( function( data ) {
                setTimeout( runPump, 500 ) ;
            })
            .error( function( data, status ){
                 console.log( `ExerciseQuestion mapping API call failed. ` +
                              `Status = ${status}, Response = ${data}` ) ;
                 event.failedPublishAttempts++ ;
                 if( event.failedPublishAttempts < MAX_FAILED_PUBLISH_ATTEMPTS ) {
                     console.log( "Attempting to publish again." ) ;
                     eventQueue.unshift( event ) ;
                     setTimeout( runPump, 1000 ) ;
                 }
                 else {
                     deadLetterQueue.push( event ) ;
                     setTimeout( runPump, 0 ) ;
                 }
            }) ;
        }
    }
}