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