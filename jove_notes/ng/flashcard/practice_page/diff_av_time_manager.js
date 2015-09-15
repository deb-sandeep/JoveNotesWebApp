/**
 * An utility class to manage and serve the average difficulty time for a 
 * question type
 *
 * - Given a question, return the predicted average time based on question type 
 *   and question difficulty
 * - Post rating, given a question and its time spent, update itself with new 
 *   values
 *
 * baseData structure
 * {
 *     "fib": [
 *         [22, 368, 15],
 *         [37, 68, 11],
 *         [47, 10, 7]
 *     ],
 *     "matching": [
 *         [37, 11, 17],
 *         [60, 15, 39]
 *     ],
 *     "true_false": [
 *         [20, 12, 13]
 *     ]
 * }
 *
 * where, keys are the question types. value is an array of arrays of 3 elements, 
 * where the 
 *		- 0th element is difficulty level
 *		- 1st element is number of attempts
 *		- 2nd element is average time for this question type and difficulty level
 *
 * The elements of the question values are arrangd in ascending order of their
 * difficulty levels.
 */
function DifficultyAverageTimeManager( baseData ) {

	this.getPredictedAverageTime = function( question ) {

		// NOTE: values will never be null. This is ensured by the getValuesArray
		// which returns an empty array in case the question type is not found
		var values = getValuesArray( question.questionType ) ;
		return getAverageTime( question, values ) ;
	} ;

	this.updateStatistics = function( question, rating, timeTaken ) {

		// As an APMNS rated card implies the student has not expended any 
		// effort, it should not influence the average time. Hence, we consider
		// the time taken to be zero in case the card is rated APMNS
		if( rating == 'APMNS' ) {
			return ;
		}

		var values = getValuesArray( question.questionType ) ;

		if( values.length == 0 ) {
			values.push( [ question.difficultyLevel, 1, timeTaken ] ) ;
		}
		else {
			for( var i=0; i<values.length; i++ ) {

				var currentDiffLevel = values[i][0] ;
				var currentAvgTime   = values[i][2] ;

				if( currentDiffLevel == question.difficultyLevel ) {
					var totalTime = ( values[i][1] * values[i][2] ) + timeTaken ;
					var newAvg    = totalTime / ( values[i][1] + 1 ) ;
					values[i][1] = values[i][1] + 1 ;
					values[i][2] = newAvg ;
					break ;
				}
			}
		}
	} ;

	function getValuesArray( questionType ) {

		if( !baseData.hasOwnProperty( questionType ) ) {
			baseData[ questionType ] = [] ;
		}
		return baseData[ questionType ] ;
	} ;

	function getAverageTime( question, values ) {

		var difficultyLevel     = question.difficultyLevel ;
		var prevToLastDiffLevel = 0 ;
		var prevToLastAvgTime   = 0 ;
		var lastDiffLevel       = 0 ;
		var lastAvgTime         = 0 ;
		var avgTime             = -1 ;

		if( values.length == 0 ) {
			return getStatisticalAverageTime( question ) ;
		}

		for( var i=0; i<values.length; i++ ) {

			var currentDiffLevel = values[i][0] ;
			var currentAvgTime   = values[i][2] ;

			if( currentDiffLevel == difficultyLevel ) {
				avgTime = currentAvgTime ;
				break ;
			}
			else if( currentDiffLevel < difficultyLevel ) {
				prevToLastDiffLevel = lastDiffLevel ;
				prevToLastAvgTime   = lastAvgTime ;
				lastDiffLevel       = currentDiffLevel ;
				lastAvgTime         = currentAvgTime ;
			}
			else if( currentDiffLevel > difficultyLevel ) {
				avgTime = ( ( currentAvgTime - lastAvgTime ) /
					        ( currentDiffLevel - lastDiffLevel ) ) * 
				          ( difficultyLevel - lastDiffLevel ) + lastAvgTime ;

				values.push( [ difficultyLevel, 0, avgTime ] ) ;
				values.sort( function( a, b ){ a[0] - b[0] ; } ) ;
				break ;
			}
		}

		if( avgTime == -1 ) {

			avgTime = ( ( lastAvgTime - prevToLastAvgTime ) / 
				        ( lastDiffLevel - prevToLastDiffLevel ) ) * 
			          ( difficultyLevel - lastDiffLevel ) + lastAvgTime ;

			values.push( [ difficultyLevel, 0, avgTime ] ) ;
			values.sort( function( a, b ){ a[0] - b[0] ; } ) ;
		}

		return Math.ceil( avgTime ) ;
	}

	function getStatisticalAverageTime( question ) {

	    var questionType = question.questionType ;
	    if( questionType == QuestionTypes.prototype.QT_FIB ) {
	        return 15 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_QA ) {
	        return 30 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_TF ) {
	        return 20 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
	        return 15 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
	        return 15 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
	        return 15 ;
	    }
	    else if( questionType == QuestionTypes.prototype.QT_MULTI_CHOICE ) {
	        return 15 ;
	    }
        return 30 ;
	}
}

