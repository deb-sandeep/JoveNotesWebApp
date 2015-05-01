// =============================================================================
// =============================================================================
function UserLearningFilterOptions() {

    this.currentLevelOptions = [ 
        { id : "NS",  name : "Not started" },
        { id : "L0",  name : "Level 0" },
        { id : "L1",  name : "Level 1" },
        { id : "L2",  name : "Level 2" },
        { id : "L3",  name : "Level 3" },
		{ id : "MAS", name : "Mastered"}
    ] ;

    this.learningEfficiencyOptions = [
        { id : "A1", name : "A1" },
        { id : "A2", name : "A2" },
        { id : "B1", name : "B1" },
        { id : "B2", name : "B2" },
        { id : "C1", name : "C1" },
        { id : "C2", name : "C2" },
        { id : "D" , name : "D"  }
    ] ;

    this.difficultyOptions = [
        { id : "VE", name : "Very easy" },
        { id : "E",  name : "Easy" },
        { id : "M",  name : "Moderate" },
        { id : "H",  name : "Hard" },
        { id : "VH", name : "Very hard" }
    ] ;
}

// =============================================================================
// =============================================================================
function RatingMatrix() {

    this.nextLevelMatrix = {
        //       E      A     P     D
        NS : [ 'L1' , 'L1', 'L0', 'L0' ],
        L0 : [ 'L1' , 'L0', 'L0', 'L0' ],
        L1 : [ 'L2' , 'L1', 'L0', 'L0' ],
        L2 : [ 'L3' , 'L1', 'L1', 'L0' ],
        L3 : [ 'MAS', 'L0', 'L0', 'L0' ]
    } ;

    this.nextActionMatrix = {
        //       E     A      P     D
        NS : [  -1,   -1,   0.5,   0.25 ],
        L0 : [  -1,    1,   0.5,   0.25 ],
        L1 : [  -1,    1,   0.5,   0.25 ],
        L2 : [  -1,    1,   0.5,   0.25 ],
        L3 : [  -1,    1,   0.5,   0.25 ]
    }

    function getIndexIntoMatrix( rating ) {

        var index = 0 ;
        if      ( rating === 'E' ) { index = 0 ; }
        else if ( rating === 'A' ) { index = 1 ; }
        else if ( rating === 'P' ) { index = 2 ; }
        else if ( rating === 'H' ) { index = 3 ; }
        return index ;
    }

    function getMatrixValue( matrix, level, rating ) {

        log.debug( "\tLevel ="   + level + " rating =" + rating ) ;

        var index  = getIndexIntoMatrix( rating ) ;
        log.debug( "\tindex = " + index ) ;
        
        var values = matrix[ level ] ;
        log.debug( "\tvalues = " + values ) ;

        var value  = values[ index ] ;
        log.debug( "\tvalue = " + value ) ;

        return value ;
    }

    this.getNextLevel = function( currentLevel, currentRating ) {
        log.debug( "Getting next level" ) ;
        return getMatrixValue( this.nextLevelMatrix, currentLevel, currentRating ) ;
    } ;

    this.getNextAction = function( currentLevel, currentRating ) {
        log.debug( "Getting next action" ) ;
        return getMatrixValue( this.nextActionMatrix, currentLevel, currentRating ) ;
    } ;
}

// =============================================================================
// =============================================================================

function JoveNotesUtil() {
// -----------------------------------------------------------------------------

this.constructPageTitle = function( chapterData ) {
	return  "[" + chapterData.subjectName + "] " +
			chapterData.chapterNumber + "." + 
			chapterData.subChapterNumber + " - " +
	        chapterData.chapterName ;
}

this.associateLearningStatsToQuestions = function( questions, userLearningStats ) {

	var learningStats = [] ;
	for( i=0; i<userLearningStats.length; i++ ) {
		var stat = userLearningStats[i] ;
		learningStats[ stat.questionId ] = stat ;
	}

	for( i=0; i<questions.length; i++ ) {
		var question = questions[i] ;
		var learningStat = null ;

		if( typeof learningStats[i] === 'undefined' ) {
			learningStat = {
				numAttempts        : 10,
				learningEfficiency : 0,
				currentLevel       : "NS"
			} ;
		}
		else {
			learningStat = learningStats[i] ;
		}
		question.learningStats = learningStat ;
		injectLabelsForValues( question ) ;
	}
}

this.renderLearningProgressPie = function( divName, progressStats ) {

    var vals   = [] ;
    var labels = [] ;
    var colors = [] ;

    if( progressStats.numCardsNS != 0 ) {
        vals.push( progressStats.numCardsNS ) ;
        labels.push( "NS-" + progressStats.numCardsNS ) ;
        colors.push( "#D0D0D0" ) ;
    } 
    if( progressStats.numCardsL0 != 0 ) {
        vals.push( progressStats.numCardsL0 ) ;
        labels.push( "L0-" + progressStats.numCardsL0 ) ;
        colors.push( "#FF0000" ) ;
    } 
    if( progressStats.numCardsL1 != 0 ) {
        vals.push( progressStats.numCardsL1 ) ;
        labels.push( "L1-" + progressStats.numCardsL1 ) ;
        colors.push( "#FF7F2A" ) ;
    }
    if( progressStats.numCardsL2 != 0 ) {
        vals.push( progressStats.numCardsL2 ) ;
        labels.push( "L2-" + progressStats.numCardsL2 ) ;
        colors.push( "#FFFF7F" ) ;
    } 
    if( progressStats.numCardsL3 != 0 ) {
        vals.push( progressStats.numCardsL3 ) ;
        labels.push( "L3-" + progressStats.numCardsL3 ) ;
        colors.push( "#AAFFAA" ) ;
    }
    if( progressStats.numCardsMastered != 0 ) {
        vals.push( progressStats.numCardsMastered ) ;
        labels.push( "MAS-" + progressStats.numCardsMastered ) ;
        colors.push( "#00FF00" ) ;
    }

    var pie = new RGraph.Pie(divName, vals)
        .set('gutter.left',   30 )
        .set('gutter.right',  30 )
        .set('gutter.top',    30 )
        .set('gutter.bottom', 30 )
        .set('strokestyle', 'rgba(0,0,0,0)')
        .set('labels', labels )
        .set('colors', colors )
        .draw();
} ;

this.renderDifficultyStatsBar = function( divName, difficultyStats ) {

    var vals   = [ 
        difficultyStats.numVE, 
        difficultyStats.numE, 
        difficultyStats.numM, 
        difficultyStats.numH, 
        difficultyStats.numVH
    ] ;

    var bar = new RGraph.Bar( {
        id     : divName,
        data   : vals,
        options: {
            labels: [ "VE", "E", "M", "H", "VH" ],
            colors: [ "#07FD00", "#9FF79D", "#FDFFB7", "#FFBF46", "#FF6A4E" ],
            gutter: {
                left   : 30,
                right  : 30,
                top    : 30,
                bottom : 30
            },
            background: {
                grid: true
            }
        }
    })
    .set( 'colors.sequential', true )
    .draw();
} ;

this.renderLearningCurveGraph = function( divName, learningCurveData ) {

    var mline = new RGraph.Line( {
        id: divName,
        data: learningCurveData,
        options: {
            Background: {
              grid: false 
            },
            ylabels: {
              count: 4
            },
            colors: [ "#D0D0D0", "#FF0000", "#FF7F2A", "#FFFF7F", "#AAFFAA", "#00FF00" ],
            filled: { self: true },
            linewidth: 0.2,
            tickmarks: false,
        }
    })
    .draw() ;
}

// -----------------------------------------------------------------------------

function injectLabelsForValues( question ) {

	question.difficultyLevelLabel = 
		getDifficultyLevelLabel( question.difficultyLevel ) ;

	question.learningEfficiencyLabel = 
		getLearningEfficiencyLabel( question.learningStats.learningEfficiency ) ;
}

function getDifficultyLevelLabel( level ) {

	if     ( level >= 0  && level < 30 ) { return "VE" ; }
	else if( level >= 30 && level < 50 ) { return "E"  ; }
	else if( level >= 50 && level < 70 ) { return "M"  ; }
	else if( level >= 70 && level < 85 ) { return "H"  ; }
	return "VH" ;
}

function getLearningEfficiencyLabel( score ) {

	if      ( score >= 90 && score <= 100 ) { return "A1" ; }
	else if ( score >= 80 && score <  90  ) { return "A2" ; }
	else if ( score >= 70 && score <  80  ) { return "B1" ; }
	else if ( score >= 60 && score <  70  ) { return "B2" ; }
	else if ( score >= 50 && score <  60  ) { return "C1" ; }
	else if ( score >= 40 && score <  50  ) { return "C2" ; }
	else                                    { return "D"  ; }
}

// -----------------------------------------------------------------------------
}