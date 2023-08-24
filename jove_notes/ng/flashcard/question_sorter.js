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

            const q1LS = q1.learningStats ;
            const q2LS = q2.learningStats ;

            const q1Attempts = q1LS.numAttempts ;
            const q2Attempts = q2LS.numAttempts ;

            if( q1Attempts === q2Attempts ) {
                return q1LS.absoluteLearningEfficiency - q2LS.absoluteLearningEfficiency
            }

            return ascending ? (q1LS.numAttempts - q2LS.numAttempts) :
                               (q2LS.numAttempts - q1LS.numAttempts) ;
        } ) ;
    }

    this.sortByEfficiency = function( ascending ) {

        questions.sort( function( q1, q2 ){

            const q1LS = q1.learningStats ;
            const q2LS = q2.learningStats ;

            const q1Attempts = q1LS.numAttempts ;
            const q2Attempts = q2LS.numAttempts ;

            const q1Eff = q1LS.absoluteLearningEfficiency ;
            const q2Eff = q2LS.absoluteLearningEfficiency ;

            if( q1Eff === q2Eff ) {
                return q1Attempts - q2Attempts ;
            }

            return ascending ? (q1Eff - q2Eff) : (q2Eff - q1Eff) ;
        } ) ;
    }

    this.sortByLevel = function( ascending ) {

        questions.sort( function( q1, q2 ){

            const q1Level = q1.learningStats.currentLevel;
            const q2Level = q2.learningStats.currentLevel;

            if( q1Level === q2Level ) {
                const q1Attempts = q1.learningStats.numAttempts ;
                const q2Attempts = q2.learningStats.numAttempts ;

                return q1Attempts - q2Attempts ;
            }
            else if( q1Level === CardLevels.prototype.NS ) {
                return -1 ;
            }
            else if( q2Level === CardLevels.prototype.NS ) {
                return 1 ;
            }

            return ascending ? q1Level.localeCompare( q2Level ) :
                               q2Level.localeCompare( q1Level ) ;
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
