function StudyStrategy( id, displayName ) {

    this.jnUtil = new JoveNotesUtil() ;

    this.id = id ;
    this.displayName = displayName ;
    this.questions = [] ;

    this.addQuestion = function( question ) {
        this.questions.push( question ) ;
    }

    this.addQuestionAtLevel = function( levels, question ) {
        if( levels.indexOf( question.learningStats.currentLevel ) != -1 ) {
            this.addQuestion( question ) ;
        }        
    }
}

StudyStrategy.prototype.offer = function( question ) {
    this.addQuestion( question ) ;
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
