function StudyStrategy( id, displayName ) {

    this.jnUtil = new JoveNotesUtil() ;

    this.id = id ;
    this.displayName = displayName ;
    this.questions = [] ;
    this.initialized = false ;

    this.histograms = {
        typeHistogram       : [],
        levelHistogram      : [],
        difficultyHistogram : [],
        efficiencyHistogram : []
    } ;

    this.filterOptions = {
        currentLevelOptions       : [], 
        learningEfficiencyOptions : [],
        difficultyOptions         : [],
        cardTypeOptions           : []
    } ;

    this.addQuestion = function( question ) {
        this.questions.push( question ) ;
        this.updateHistogramCluster( question ) ;
    }

    this.addQuestionAtLevel = function( levels, question ) {
        if( levels.indexOf( question.learningStats.currentLevel ) != -1 ) {
            this.addQuestion( question ) ;
        }        
    }

    this.updateHistogramCluster = function( question ) {
        var cardParentType  = question.elementType ;
        var difficultyLabel = question.difficultyLabel ;
        var currentLevel    = question.learningStats.currentLevel ;
        var efficiencyLabel = question.learningStats.efficiencyLabel ;

        if( this.histograms.typeHistogram.hasOwnProperty( cardParentType ) ) {
            this.histograms.typeHistogram[ cardParentType ]++ ;
        }
        else {
            this.histograms.typeHistogram[ cardParentType ] = 1 ;
        }

        if( this.histograms.levelHistogram.hasOwnProperty( currentLevel ) ) {
            this.histograms.levelHistogram[ currentLevel ]++ ;
        }
        else {
            this.histograms.levelHistogram[ currentLevel ] = 1 ;
        }

        if( this.histograms.difficultyHistogram.hasOwnProperty( difficultyLabel ) ) {
            this.histograms.difficultyHistogram[ difficultyLabel ]++ ;
        }
        else {
            this.histograms.difficultyHistogram[ difficultyLabel ] = 1 ;
        }

        if( this.histograms.efficiencyHistogram.hasOwnProperty( efficiencyLabel ) ) {
            this.histograms.efficiencyHistogram[ efficiencyLabel ]++ ;
        }
        else {
            this.histograms.efficiencyHistogram[ efficiencyLabel ] = 1 ;
        }
    }

    this.printHistogram = function() {
        for( var histogramName in this.histograms ) {
            if( this.histograms.hasOwnProperty( histogramName ) ) {
                log.debug( "Printing histogram " + histogramName ) ;
                var map = this.histograms[ histogramName ] ;
                var total = 0 ;
                for( var type in map ) {
                    if( map.hasOwnProperty( type ) ) {
                        log.debug( "\t" + type + " = " + map[type] ) ;
                        total += map[type] ;
                    }
                }
                log.debug( "\t\ttotal = " + total ) ;
            }
        }
    }

    this.prepareFilterOptions = function() {
        this.prepareCardTypeFilterOptions() ;
        this.prepareCardLevelOptions() ;
        this.prepareCardDifficultyOptions() ;
        this.prepareCardEfficiencyOptions() ;
    }

    this.prepareCardTypeFilterOptions = function() {

        var optionText = [] ;

        optionText[ "word_meaning"    ] = "Word Meaning" ;
        optionText[ "question_answer" ] = "Question Answer" ;
        optionText[ "fib"             ] = "Fill in the blanks" ;
        optionText[ "definition"      ] = "Definition" ;
        optionText[ "character"       ] = "Character" ;
        optionText[ "matching"        ] = "Matching" ;
        optionText[ "event"           ] = "Event" ;
        optionText[ "true_false"      ] = "True False" ;
        optionText[ "chem_equation"   ] = "Chemical Equation" ;
        optionText[ "chem_compound"   ] = "Chemical Compound" ;
        optionText[ "spellbee"        ] = "Spellbee" ;
        optionText[ "image_label"     ] = "Image label" ;
        optionText[ "equation"        ] = "Equation" ;
        optionText[ "rtc"             ] = "Reference to context" ;
        optionText[ "multi_choice"    ] = "Multiple choice" ;  
        optionText[ "voice2text"      ] = "Voice to Text" ;

        populateFilterOptions( this.histograms.typeHistogram, optionText, 
                               this.filterOptions.cardTypeOptions ) ;
    }

    this.prepareCardLevelOptions = function() {

        var optionText = [] ;

        optionText[ "NS" ] = "Not Started" ;
        optionText[ "L0" ] = "Level 0" ;
        optionText[ "L1" ] = "Level 1" ;
        optionText[ "L2" ] = "Level 2" ;
        optionText[ "L3" ] = "Level 3" ;

        populateFilterOptions( this.histograms.levelHistogram, optionText,
                               this.filterOptions.currentLevelOptions ) ;
    }

    this.prepareCardDifficultyOptions = function () {

        var optionText = [] ;

        optionText[ "VE" ] = "Very easy" ;
        optionText[ "E"  ] = "Easy" ;
        optionText[ "M"  ] = "Moderate" ;
        optionText[ "H"  ] = "Hard" ;
        optionText[ "VH" ] = "Very hard" ;

        populateFilterOptions( this.histograms.difficultyHistogram, optionText,
                               this.filterOptions.difficultyOptions ) ;
    }

    this.prepareCardEfficiencyOptions = function () {

        var optionText = [] ;

        optionText[ "A1" ] = "A1" ;
        optionText[ "A2" ] = "A2" ;
        optionText[ "B1" ] = "B1" ;
        optionText[ "B2" ] = "B2" ;
        optionText[ "C1" ] = "C1" ;
        optionText[ "C2" ] = "C2" ;
        optionText[ "D"  ] = "D" ;

        populateFilterOptions( this.histograms.efficiencyHistogram, optionText,
                               this.filterOptions.learningEfficiencyOptions ) ;
    }

    function populateFilterOptions( histogram, keyNameMapping, filterOptions ) {

        filterOptions.length = 0 ;

        for( var key in histogram ) {

            if( histogram.hasOwnProperty( key ) ) {

                var count = histogram[ key ] ;
                if( count > 0 ) {

                    var name = 'Unknown Element' ;
                    if( keyNameMapping.hasOwnProperty( key ) ) {
                        name = keyNameMapping[ key ] ;
                    }

                    var str = "" + count ;
                    var pad = "000" ;
                    str = pad.substring( 0, pad.length - str.length ) + str ;
                    str = str + " - " + name ;

                    filterOptions.push( {
                        id : key,
                        name : str,
                        count : count
                    }) ;
                }
            }
        }

        filterOptions.sort( function( a, b ){ 
            return b.count - a.count ; 
        } ) ;
    }
}

StudyStrategy.prototype.offer = function( question ) {
    this.addQuestion( question ) ;
}

StudyStrategy.prototype.initializeForFirstTimeUsage = function() {
    if( !this.initialized ) {
        log.debug( this.displayName + ". Initializing for first time usage." ) ;
        this.prepareFilterOptions() ;
        this.initialized = true ;
    }
}

StudyStrategy.prototype.initialize = function() {
    log.debug( this.displayName + ". Force initializing." ) ;
    this.prepareFilterOptions() ;
}

// -----------------------------------------------------------------------------
SSR_StudyStrategy.prototype = new StudyStrategy() ;
SSR_StudyStrategy.prototype.constructor = SSR_StudyStrategy;

function SSR_StudyStrategy() {
    StudyStrategy.call( this, "SSR", "Spaced Repetition" ) ;
}

SSR_StudyStrategy.prototype.offer = function( question ) {
    
    var thresholdDelta = this.jnUtil.getSSRThresholdDelta( question ) ;
    if( thresholdDelta < 0 && question.learningStats.currentLevel != 'NS' ) return ;

    this.addQuestion( question ) ;
}

// -----------------------------------------------------------------------------
NuHard_StudyStrategy.prototype = new StudyStrategy() ;
NuHard_StudyStrategy.prototype.constructor = NuHard_StudyStrategy ;

function NuHard_StudyStrategy() {
    StudyStrategy.call( this, "EFF_HARD", "Efficiency (Hard)" ) ;
}

// -----------------------------------------------------------------------------
NuEasy_StudyStrategy.prototype = new StudyStrategy() ;
NuEasy_StudyStrategy.prototype.constructor = NuEasy_StudyStrategy ;

function NuEasy_StudyStrategy() {
    StudyStrategy.call( this, "EFF_EASY", "Efficiency (Easy)" ) ;
}

// -----------------------------------------------------------------------------
Objective_StudyStrategy.prototype = new StudyStrategy() ;
Objective_StudyStrategy.prototype.constructor = Objective_StudyStrategy ;

function Objective_StudyStrategy() {
    StudyStrategy.call( this, "OBJECTIVE", "Objective" ) ;
}

// -----------------------------------------------------------------------------
Subjective_StudyStrategy.prototype = new StudyStrategy() ;
Subjective_StudyStrategy.prototype.constructor = Subjective_StudyStrategy ;

function Subjective_StudyStrategy() {
    StudyStrategy.call( this, "SUBJECTIVE", "Subjective" ) ;
}

// -----------------------------------------------------------------------------
BottomUpL0_StudyStrategy.prototype = new StudyStrategy() ;
BottomUpL0_StudyStrategy.prototype.constructor = BottomUpL0_StudyStrategy ;

function BottomUpL0_StudyStrategy() {
    StudyStrategy.call( this, "BOTTOM_UP_L0", "Bottoms Up (L0)" ) ;
}

BottomUpL0_StudyStrategy.prototype.offer = function( question ) {
    this.addQuestionAtLevel( ['NS', 'L0'], question ) ; 
}

// -----------------------------------------------------------------------------
BottomUpL1_StudyStrategy.prototype = new StudyStrategy() ;
BottomUpL1_StudyStrategy.prototype.constructor = BottomUpL1_StudyStrategy ;

function BottomUpL1_StudyStrategy() {
    StudyStrategy.call( this, "BOTTOM_UP_L1", "Bottoms Up (L1)" ) ;
}

BottomUpL1_StudyStrategy.prototype.offer = function( question ) {
    this.addQuestionAtLevel( ['NS', 'L0', 'L1' ], question ) ; 
}

// -----------------------------------------------------------------------------
BottomUpL2_StudyStrategy.prototype = new StudyStrategy() ;
BottomUpL2_StudyStrategy.prototype.constructor = BottomUpL2_StudyStrategy ;

function BottomUpL2_StudyStrategy() {
    StudyStrategy.call( this, "BOTTOM_UP_L2", "Bottoms Up (L2)" ) ;
}

BottomUpL2_StudyStrategy.prototype.offer = function( question ) {
    this.addQuestionAtLevel( ['NS', 'L0', 'L1', 'L2' ], question ) ; 
}

// -----------------------------------------------------------------------------
BottomUpL3_StudyStrategy.prototype = new StudyStrategy() ;
BottomUpL3_StudyStrategy.prototype.constructor = BottomUpL3_StudyStrategy ;

function BottomUpL3_StudyStrategy() {
    StudyStrategy.call( this, "BOTTOM_UP_L3", "Bottoms Up (L3)" ) ;
}

BottomUpL3_StudyStrategy.prototype.offer = function( question ) {
    this.addQuestionAtLevel( ['NS', 'L0', 'L1', 'L2', 'L3' ], question ) ; 
}
