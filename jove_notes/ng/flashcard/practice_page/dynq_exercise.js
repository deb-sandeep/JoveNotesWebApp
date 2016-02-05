function ExerciseManager( questionObj, textFormatter, $scope ) {

    var jnUtils = null ;

    var formattedQuestion = null ;
    var formattedAnswer   = null ;
    var formattedHints    = [] ;
    var showNextHintBtn   = null ;

    var questionDiv = null ;

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
        // Disable the show next hint button
    } ;
    
    this.getAnswerUI = function() {
        return DIV( P( { innerHTML : formattedAnswer } ) ) ;
    } ;

    // -------------------------------------------------------------------------
    var prepareQuestionUI = function() {

        var questionP = P( { innerHTML : formattedQuestion } ) ;

        var trDOMs    = [] ;
        var numRows   = questionObj.hints.length + 2 ;

        trDOMs.push( TR( TD( questionP ) ) ) ;
        trDOMs.push( TR( TD( BUTTON( "Show next hint" ) ) ) ) ;

        for( var i=2; i<numRows; i++ ) {
            trDOMs.push( TR( TD( { innerHTML : optionValue } ) ) ) ;
        }

        questionDiv = DIV( questionP, TABLE( trDOMs ) ) ;        
    }
} ;
