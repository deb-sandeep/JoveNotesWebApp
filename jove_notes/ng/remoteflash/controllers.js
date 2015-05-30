remoteFlashCardApp.controller( 'RemoteFlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var lastMessageId = -1 ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts   = [] ;
$scope.userName = userName ;
$scope.messages = [] ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing RemoteFlashCardController." ) ;
runMesssageFetchPump() ;
runMessageProcessPump() ;

// ---------------- Controller methods -----------------------------------------
$scope.addErrorAlert = function( msgString ) {
    $scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
    $scope.alerts.splice( index, 1 ) ;
};

// ---------------- Private functions ------------------------------------------
function runMesssageFetchPump() {

    log.debug( "Running message pump." ) ;
    $http.get( "/jove_notes/api/RemoteFlashMessage", {
        params : {
            lastMessageId : lastMessageId
        }
    })
    .success( function( data ){
        log.debug( "Received data from server." ) ;
        if( Array.isArray( data ) ) {
            for( var i=0; i<data.length; i++ ) {
                $scope.data.push( data[i] ) ;
            }

            lastMessageId = data[ data.length -1 ].messageId ;
            log.debug( "Last message id = " + lastMessageId ) ;
        }
    })
    .error( function( data ){
        log.error( "Error getting remote flash messages." + data ) ;
        $scope.addErrorAlert( "Could not receive remote flash messages." + data ) ;
    }) ;
    setTimeout( runMesssageFetchPump, 1000 ) ;
}

function runMessageProcessPump() {

    log.debug( "Executing message processing pump" ) ;
    while( $scope.messages.length > 0 ) {
        var message = $scope.messages.shift() ;
        processMessage( message ) ;
    }
    setTimeout( runMessageProcessPump, 500 ) ;
}

function processMessage( message ) {

    log.debug( "Processing message." ) ;
}

function preProcessFlashCardQuestions( questions ) {

    question.difficultyLabel = 
        jnUtil.getDifficultyLevelLabel( question.difficultyLevel ) ;

    question.learningStats.efficiencyLabel = 
        jnUtil.getLearningEfficiencyLabel( question.learningStats.learningEfficiency ) ;

    associateHandler( question ) ;
}

function associateHandler( question ) {

    var questionType = question.questionType ;

    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        question.handler = new FIBHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        question.handler = new QAHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        question.handler = new TFHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        question.handler = new MatchingHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        question.handler = new ImageLabelHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        question.handler = new SpellBeeHandler( $scope.chapterDetails, question ) ;
    }
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }
}
// ---------------- End of controller ------------------------------------------
} ) ;



