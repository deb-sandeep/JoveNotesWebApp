function ExerciseManager( questionObj, textFormatter, $scope ) {

    var jnUtils = null ;

    var formattedQuestion = null ;
    var formattedAnswer   = null ;
    var formattedHints    = [] ;
    var currentHintIndex  = 0 ;

    var questionDiv     = null ;
    var questionPara    = null ;
    var showNextHintBtn = null ;
    var hintsTable      = null ;
    var hintsTRList     = [] ;

    var construct = function( questionObj, textFormatter, $scope ) {

        jnUtils = new JoveNotesUtil() ;

        formattedQuestion = textFormatter.format( questionObj.question ) ;
        formattedAnswer   = textFormatter.format( questionObj.explanation ) ;

        for( var i=0; i<questionObj.hints.length; i++ ) {
            formattedHints.push( textFormatter.format( questionObj.hints[i] ) ) ;
        }
    } ;

    construct( questionObj, textFormatter, $scope ) ;

    // -------------------------------------------------------------------------
    this.initialize = function() {
        prepareQuestionUI() ;
    } ;

    this.getQuestionUI = function() {
        return questionDiv ;
    } ;
    
    this.freezeQuestionUI = function() {
        if( formattedHints.length > 0 ) {
            showNextHintBtn.parentNode.removeChild( showNextHintBtn ) ;
        }
    } ;
    
    this.getAnswerUI = function() {
        return DIV( P( { innerHTML : formattedAnswer } ) ) ;
    } ;

    // -------------------------------------------------------------------------
    var prepareQuestionUI = function() {

        questionPara    = P( { innerHTML : formattedQuestion } ) ;
        showNextHintBtn = BUTTON( { type  : "button", 
                                    class : "btn btn-default btn-xs" },
                                  "Show next hint." ) ;
        showNextHintBtn.onclick = showNextHint ;

        hintsTable = TABLE( { class : "table table-striped hint_table" } ) ;

        if( formattedHints.length > 0 ) {
            questionDiv = DIV( questionPara, showNextHintBtn, hintsTable ) ;        
        }
        else {
            questionDiv = DIV( questionPara ) ;
        }
    }

    var showNextHint = function() {
        if( currentHintIndex < formattedHints.length ) {
            var tr          = hintsTable.insertRow(-1) ;
            var indexCell   = tr.insertCell( 0 ) ;
            var contentCell = tr.insertCell( 1 ) ;

            indexCell.innerHTML   = (currentHintIndex+1) + " )" ;
            contentCell.innerHTML = formattedHints[currentHintIndex] ;

            currentHintIndex++ ;
            if( currentHintIndex >= formattedHints.length ) {
                showNextHintBtn.style.visibility = "hidden" ;
            }
        }
    }
} ;
