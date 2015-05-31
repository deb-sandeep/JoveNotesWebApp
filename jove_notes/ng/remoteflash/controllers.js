remoteFlashCardApp.controller( 'RemoteFlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var lastMessageId = -1 ;
var messages = [] ;

// ---------------- Controller variables ---------------------------------------
$scope.SCREEN_WAITING_TO_START = "waiting_to_start" ;
$scope.SCREEN_SESSION_SETTINGS = "session_settings" ;
$scope.SCREEN_PRACTICE         = "session_practice" ;
$scope.SCREEN_SESSION_END      = "session_end" ;

$scope.alerts   = [] ;
$scope.userName = userName ;
$scope.pageTitle = null ;

$scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;

$scope.chapterDetails    = null ;
$scope.difficultyStats   = null ;
$scope.progressSnapshot  = null ;
$scope.learningCurveData = null ;
$scope.studyCriteria     = null ;

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

    // TODO: For testing I am setting -1 as last message Id always. This is to 
    //       ensure a full playback of messages. Change this to lastMessageId
    //       variable once ready.
    $http.get( "/jove_notes/api/RemoteFlashMessage?lastMessageId=" + lastMessageId )
    .success( function( data ){
        if( Array.isArray( data ) ) {
            log.debug( "Received " + data.length + " messages from server." ) ;
            for( var i=0; i<data.length; i++ ) {

                messages.push( data[i] ) ;
                if( i == data.length -1 ) {
                    lastMessageId = data[ i ].id ;
                    log.debug( "Last message id = " + lastMessageId ) ;
                }
            }
        }
    })
    .error( function( data ){
        log.error( "Error getting remote flash messages." + data ) ;
        $scope.addErrorAlert( "Could not receive remote flash messages." + data ) ;
    }) ;
    setTimeout( runMesssageFetchPump, 3000 ) ;
}

function runMessageProcessPump() {

    while( messages.length > 0 ) {
        var message = messages.shift() ;
        log.debug( "Processing message." ) ;
        log.debug( "    message id   = " + message.id ) ;
        log.debug( "    message type = " + message.msgType ) ;
        log.debug( "    content      = " + JSON.stringify( message.content ) ) ;

        // try {
            if( message.msgType == "yet_to_start" ) {
                $scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;
            }
            else if( message.msgType == "start_session" ) {
                processStartSessionMessage( message ) ;
            }
            else {
                throw "Unknown message type " + message.msgType ;
            }
        // }
        // catch( e ) {
        //     log.error( "Error processing message." + e ) ;
        // }
    }
    setTimeout( runMessageProcessPump, 1000 ) ;
}

function processMessage( message ) {

}

function processStartSessionMessage( message ) {

    $scope.chapterDetails    = message.content.chapterDetails ;
    $scope.difficultyStats   = message.content.difficultyStats ;
    $scope.progressSnapshot  = message.content.progressSnapshot ;
    $scope.learningCurveData = message.content.learningCurveData ;
    $scope.studyCriteria     = message.content.studyCriteria ;
    
    $scope.studyCriteria.maxCards = 
        ( $scope.studyCriteria.maxCards == 10000 ) ? 
        "Unlimited" : $scope.studyCriteria.maxCards ;

    $scope.studyCriteria.maxTime  = 
        ( $scope.studyCriteria.maxTime == -1 ) ? 
        "Unlimited" : $scope.studyCriteria.maxTime + " minutes" ;

    $scope.studyCriteria.maxNewCards = 
        ( $scope.studyCriteria.maxNewCards == 10000 ) ? 
        "Unlimited" : $scope.studyCriteria.maxNewCards ;

    $scope.pageTitle = jnUtil.constructPageTitle( $scope.chapterDetails ) ;

    jnUtil.renderLearningProgressPie( 'learningStatsPieGraph',
                                      $scope.progressSnapshot ) ;

    jnUtil.renderDifficultyStatsBar ( 'difficultyStatsBarGraph',
                                      $scope.difficultyStats ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                                      $scope.learningCurveData ) ;

    $scope.currentScreen = $scope.SCREEN_SESSION_SETTINGS ;
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



