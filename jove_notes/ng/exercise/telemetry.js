function ExerciseTelemetry( $scope, $http ) {

    const UPDATE_SESSION_API = "/jove_notes/api/Exercise/UpdateSession" ;
    const EXERCISE_EVENT_API = "/jove_notes/api/ExerciseEvent" ;
    const UPDATE_QUESTION_API= "/jove_notes/api/ExerciseQuestion" ;

    const PRINT_LAST_ELEMENT = false ;

    const eventQueue = [] ;

    function getUpdateSessionEvent() {
        let event = {
            'eventType' : 'UpdateSession',
            'endpoint' : `${UPDATE_SESSION_API}/${$scope.exerciseSessionId}`,
            'payload' : {}
        } ;
        eventQueue.push( event ) ;
        return event ;
    }

    function getUpdateExerciseQuestionEvent( question ) {
        let event = {
            'eventType' : 'UpdateExQuestion',
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

    this.logEvent = function( eventName, question = null ) {

        const questionId = question == null ? null : question.questionId ;
        eventQueue.push( {
            'eventType' : 'MarkerEvent',
            'endpoint' : EXERCISE_EVENT_API,
            'payload' : {
                'exerciseId' : $scope.exerciseSessionId,
                'timestamp'  : Date.now(),
                'questionId' : questionId,
                'action'     : eventName
            }
        } ) ;

        this.printLastElementInQueue() ;
    }

    this.updateSessionCompleted = function() {
        console.log( "updateSessionCompleted" ) ;
        getUpdateSessionEvent().payload[ 'completed' ] = 1 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalSolveTime = function() {
        console.log( "updateSessionTotalSolveTime" ) ;
        getUpdateSessionEvent().payload[ 'totalSolveTime' ] = $scope.durationTillNowInMillis/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalPauseTime = function() {
        console.log( "updateSessionTotalPauseTime" ) ;
        getUpdateSessionEvent().payload[ 'pauseTime' ] = $scope.totalPauseTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalReviewTime = function() {
        console.log( "updateSessionTotalReviewTime" ) ;
        getUpdateSessionEvent().payload[ 'reviewTime' ] = $scope.totalReviewTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionStudyTime = function() {
        console.log( "updateSessionStudyTime" ) ;
        getUpdateSessionEvent().payload[ 'studyTime' ] = $scope.totalStudyTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalQuestions = function() {
        console.log( "updateSessionTotalQuestions" ) ;
        getUpdateSessionEvent().payload[ 'totalQuestions' ] = $scope.questions.length ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionNumCorrect = function( numCorrect ) {
        console.log( "updateSessionNumCorrect" ) ;
        getUpdateSessionEvent().payload[ 'numCorrect' ] = numCorrect ;
        this.printLastElementInQueue() ;
    }

    this.updateSessionTotalMarks = function( totalMarks ) {
        console.log( "updateSessionTotalMarks" ) ;
        getUpdateSessionEvent().payload[ 'totalMarks' ] = totalMarks ;
        this.printLastElementInQueue() ;
    }

    // ExerciseQuestion telemetry

    this.updateExQuestionTotalTimeTaken = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'totalTimeTaken' ] = question._sessionVars.timeSpent/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionNumAttempts = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'numAttempts' ] = question._sessionVars.numAttempts ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionStudyTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'studyTime' ] = question._sessionVars.studyTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionAttemptTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'attemptTime' ] = question._sessionVars.attemptTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionReviewTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'reviewTime' ] = question._sessionVars.reviewTime/1000 ;
        this.printLastElementInQueue() ;
    }

    this.updateExQuestionPauseTime = function( question ) {
        const event = getUpdateExerciseQuestionEvent( question ) ;
        event.payload[ 'pauseTime' ] = question._sessionVars.pauseTime/1000 ;
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
}