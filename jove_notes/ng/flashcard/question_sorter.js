function QuestionSorter( questions ) {

    this.sortByType = function( sortType ) {
        if( sortType === "Random" ) {
            this.shuffle() ;
        }
        else if( sortType === "Num Attempts (Asc)" ) {
            this.sortByNumAttempts( true ) ;
        }
        else if( sortType === "Num Attempts (Desc)" ) {
            this.sortByNumAttempts( false ) ;
        }
        else if( sortType === "Level (Asc)" ) {
            this.sortByLevel( true ) ;
        }
        else if( sortType === "Level (Desc)" ) {
            this.sortByLevel( false ) ;
        }
        else if( sortType === "Efficiency (Asc)" ) {
            this.sortByEfficiency( true ) ;
        }
        else if( sortType === "Efficiency (Desc)" ) {
            this.sortByEfficiency( false ) ;
        }
        else if( sortType === "Recency" ) {
            this.sortByRecency() ;
        }
        else if( sortType === "Retention" ) {
            this.sortByRetention() ;
        }
    }

    this.shuffle = function() {
        questions.shuffleFrom( 0 ) ;
    }
    this.sortByNumAttempts = function( ascending ) {
        questions.sort( function( q1, q2 ){
            return ascending ? (q1.learningStats.numAttempts - q2.learningStats.numAttempts) :
                               (q2.learningStats.numAttempts - q1.learningStats.numAttempts) ;
        } ) ;
    }

    this.sortByEfficiency = function( ascending ) {
        questions.sort( function( q1, q2 ){
            return ascending ? (q1.learningStats.absoluteLearningEfficiency - q2.learningStats.absoluteLearningEfficiency) :
                               (q2.learningStats.absoluteLearningEfficiency - q1.learningStats.absoluteLearningEfficiency) ;
        } ) ;
    }

    this.sortByLevel = function( ascending ) {
        questions.sort( function( q1, q2 ){
            const q1Level = q1.learningStats.currentLevel;
            const q2Level = q2.learningStats.currentLevel;

            if( q1Level === q2Level ) {
                return 0 ;
            }
            else if( q1Level === CardLevels.prototype.NS ) {
                return -1 ;
            }
            else if( q2Level === CardLevels.prototype.NS ) {
                return 1 ;
            }
            return q1Level.localeCompare( q2Level ) ;
        } ) ;
    }

    this.sortByRecency = function() {

        const util = new JoveNotesUtil() ;
        questions.sort( function( q1, q2 ){
            // tla => Time since Last Attempt
            const tlaCard1 = util.getSSRThresholdDelta( q1 );
            const tlaCard2 = util.getSSRThresholdDelta( q2 );

            if( tlaCard1 === -1 && tlaCard2 > -1 ) {
                return -1 ;
            }
            else if( tlaCard2 === -1 && tlaCard1 > -1 ) {
                return 1 ;
            }
            return tlaCard2 - tlaCard1 ;
        } ) ;
    }

    this.sortByRetention = function() {
        questions.sort( function( q1, q2 ){
            return q1.learningStats.retentionValue -
                   q2.learningStats.retentionValue ;
        } ) ;
    }
}