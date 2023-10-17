// =============================================================================
// =============================================================================
// Note that the notes filter options do not have the current level options.
// Remember that notes and cards are separate entities, where cards are 
// derived from notes. The learning efficiency and difficulty level of notes
// elements are an average value of that of the cards derived from the notes
// elements.
function NotesFilterOptions() {

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

    this.levelOptions = [
        { id : "NS",  name : "Not Started" },
        { id : "L0",  name : "Level 0" },
        { id : "L1",  name : "Level 1" },
        { id : "L2",  name : "Level 2" },
        { id : "L3",  name : "Level 3" },
        { id : "MAS", name : "Mastered" }
    ] ;
}

function ExerciseFilterOptions() {

    this.levelOptions = [
        { id : "NS",  name : "Not Started" },
        { id : "L0",  name : "Level 0" },
        { id : "MAS", name : "Mastered" }
    ] ;

    this.numAttemptsOptions = [
        { id : "0", name : "0 or more attempts" },
        { id : "1", name : "1 or more attempt" },
        { id : "2", name : "2 or more attempts" },
        { id : "3", name : "3 or more attempts" }
    ] ;
}

// =============================================================================
// =============================================================================
function RatingMatrix() {

    // NOTE: These array values are carefully calibrated. Please DO NOT change
    //       the values without understanding their significance.
    this.nextLevelMatrix = {
        //       E      A     P     H
        NS : [ 'L1' , 'L1', 'L0', 'L0' ],
        L0 : [ 'L1' , 'L0', 'L0', 'L0' ],
        L1 : [ 'L2' , 'L1', 'L0', 'L0' ],
        L2 : [ 'L3' , 'L2', 'L1', 'L0' ],
        L3 : [ 'MAS', 'L3', 'L1', 'L0' ]
    } ;

    this.nextActionMatrix = {
        //       E     A      P     H
        NS : [  -1,   -1,   0.5,   0.25 ],
        L0 : [  -1,   -1,   0.5,   0.25 ],
        L1 : [  -1,    1,   0.5,   0.25 ],
        L2 : [  -1,    1,   0.5,   0.25 ],
        L3 : [  -1,    1,   0.5,   0.25 ]
    }

    // This matrix decides on the base fatigue score. The base figure is further
    // attenuated by other factors like overshoot percentage and time taken
    // The base fatigue score is an decimal in the range -1 to 1. -1 implies
    // decrease in fatigue
    this.fatigueScoreMatrix = {
        //       E     A     P    H
        NS : [  -1.0, -0.5, 0.5,  1 ],
        L0 : [  -0.5,  0.5, 0.7,  1 ],
        L1 : [  -0.5,  0.6, 0.8,  1 ],
        L2 : [  -0.8,  0.7, 0.9,  1 ],
        L3 : [  -1.0,  0.8, 1.0,  1 ]
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

        var index  = getIndexIntoMatrix( rating ) ;
        var values = matrix[ level ] ;
        var value  = values[ index ] ;

        return value ;
    }

    this.getNextLevel = function( question, numAttempts, currentLevel, currentRating ) {

        // If we are redoing a question within 24 hour period, don't change
        // level of the card. Retention has not kicked in yet.
        const lastAttemptTime = question.learningStats.lastAttemptTime ;
        if( lastAttemptTime > 0 ) {
            let millisSinceLastAttempt = new Date().getTime() - lastAttemptTime ;
            if( millisSinceLastAttempt < 0 ) {
                millisSinceLastAttempt += (5*60+30)*60*1000 ;
            }
            const hrsSinceLastAttempt = millisSinceLastAttempt/(1000*60*60) ;
            if( hrsSinceLastAttempt < 24 ) {
                if( currentRating === 'E' || currentRating === 'P' ) {
                    return currentLevel;
                }
            }
        }

        if( numAttempts > 1 ) {
            return currentLevel ;
        }
        else if( currentRating == 'APM' || currentRating == 'APMNS' ) {
            return 'MAS' ;
        }
        else {
            return getMatrixValue( this.nextLevelMatrix, 
                                   currentLevel, currentRating ) ;
        }
    } ;

    this.getNextAction = function( currentLevel, currentRating ) {
        if( currentRating == 'APM' || currentRating == 'APMNS' ) {
            return -1 ;
        }
        else {
            return getMatrixValue( this.nextActionMatrix, 
                                   currentLevel, currentRating ) ;
        }
    } ;

    this.getFatigueContribution = function( currentLevel, currentRating,
                                            timeSpent ) {
        var baseScore = 0 ;
        if( currentRating == 'APM' || currentRating == 'APMNS' ) {
            baseScore = -1 ;
        }
        else {
            baseScore = getMatrixValue( this.fatigueScoreMatrix, 
                                        currentLevel, currentRating ) ;
        }
        baseScore *= 10 ;
        // At this point baseScore is in the range -10 to 10

        // The more the time spent, the higher the fatigue
        if( timeSpent > 10 ) {
            var timeContributionToFatigue = Math.round( 5 * ( 1 - Math.exp( -timeSpent/25 ) ) ) ;
            baseScore += timeContributionToFatigue ;
        }

        return baseScore ;
    } ;
}

// =============================================================================
// =============================================================================

function JoveNotesUtil() {
// -----------------------------------------------------------------------------
/**
 * This function takes the code of the function body as a string and returns
 * an instance of the function. This function returns null in case the 
 * code could not be parsed. Approprirate error messages are logged to the 
 * console.
 */
this.makeObjectInstanceFromString = function( b64EncodedBody ) {

    var fn = null ;
    var fnInstance = null ;

    try {
        var clsBodyAsString = atob( b64EncodedBody ) ;
        // log.debug( "Creating function from code - \n" + clsBodyAsString ) ;

        try {
            if( arguments.length > 1 ) {
                fn = new Function( '$util', '$c', clsBodyAsString ) ;
                fnInstance = new fn( new ScriptUtilities(), arguments[1] ) ;
            }
            else {
                fn = new Function( '$util', clsBodyAsString ) ;
                fnInstance = new fn( new ScriptUtilities() ) ;
            }
        }
        catch( e ) {
            log.error( "Error creating Function instance. Error message = " + e + 
                       ".\nClass body = " + clsBodyAsString ) ;
        }
    }
    catch( e ) {
        log.error( "Error creating Function. Error message = " + e + 
                   ".\nClass body = " + clsBodyAsString ) ;
    }
    return fnInstance ;
}

this.constructPageTitle = function( chapterDetails ) {

	return  "[" + chapterDetails.subjectName + "] " +
			chapterDetails.chapterNumber + "." + 
			chapterDetails.subChapterNumber + " - " +
	        chapterDetails.chapterName ;
}

this.getResourcePath = function( chapterDetails ) {

    return  "/apps/jove_notes/workspace/" + 
            chapterDetails.syllabusName + "/" + 
            chapterDetails.subjectName  + "/" + 
            chapterDetails.chapterNumber + "/" + 
            chapterDetails.subChapterNumber + "/" ;
}

this.getImgResourcePath = function( chapterDetails ) {
    return  this.getResourcePath( chapterDetails ) + "img/" ;
}

this.getAudioResourcePath = function( chapterDetails ) {
    return  this.getResourcePath( chapterDetails ) + "audio/" ;
}

this.getDocResourcePath = function( chapterDetails ) {
    return  this.getResourcePath( chapterDetails ) + "doc/" ;
}

this.renderLearningProgressPie = function( divName, progressStats ) {

    if( isDebug() )return ;

    const vals = [];
    const labels = [];
    const colors = [];

    if( progressStats.numNS !== 0 ) {
        vals.push( progressStats.numNS ) ;
        labels.push( "NS-" + progressStats.numNS ) ;
        colors.push( "#D0D0D0" ) ;
    } 
    if( progressStats.numL0 !== 0 ) {
        vals.push( progressStats.numL0 ) ;
        labels.push( "L0-" + progressStats.numL0 ) ;
        colors.push( "#FF0000" ) ;
    } 
    if( progressStats.numL1 !== 0 ) {
        vals.push( progressStats.numL1 ) ;
        labels.push( "L1-" + progressStats.numL1 ) ;
        colors.push( "#FF7F2A" ) ;
    }
    if( progressStats.numL2 !== 0 ) {
        vals.push( progressStats.numL2 ) ;
        labels.push( "L2-" + progressStats.numL2 ) ;
        colors.push( "#FFFF7F" ) ;
    } 
    if( progressStats.numL3 !== 0 ) {
        vals.push( progressStats.numL3 ) ;
        labels.push( "L3-" + progressStats.numL3 ) ;
        colors.push( "#AAFFAA" ) ;
    }
    if( progressStats.numMAS !== 0 ) {
        vals.push( progressStats.numMAS ) ;
        labels.push( "MAS-" + progressStats.numMAS ) ;
        colors.push( "#00FF00" ) ;
    }

    clearCanvas( divName ) ;
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

    if( isDebug() )return ;

    const vals = [
        difficultyStats.numVE,
        difficultyStats.numE,
        difficultyStats.numM,
        difficultyStats.numH,
        difficultyStats.numVH
    ];

    clearCanvas( divName ) ;
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

this.renderBarChart = function( divName, chartData ) {

    if( document.getElementById( divName ) == null ) return ;

    const dataVals = [];
    const labelVals = [];
    const colorVals = [];

    for( const seriesName in chartData ) {
        if( chartData.hasOwnProperty( seriesName ) ) {
            labelVals.push( seriesName ) ;
            dataVals.push( chartData[ seriesName ][0] ) ;
            colorVals.push( chartData[ seriesName ][1] ) ;
        }
    }

    clearCanvas( divName ) ;
    const bar = new RGraph.Bar({
        id: divName,
        data: dataVals,
        options: {
            labels: labelVals,
            colors: colorVals,
            gutter: {
                left: 30,
                right: 30,
                top: 30,
                bottom: 30
            },
            background: {
                grid: true
            }
        }
    })
        .set('colors.sequential', true)
        .draw();
}

this.renderLearningCurveGraph = function( divName, learningCurveData ) {

    if( isDebug() )return ;

    const graphData = [
        [], [], [], [], [], []
    ];

    for( var i=0; i<learningCurveData.length; i++ ) {
        var snapShot = learningCurveData[i] ;
        graphData[0].push( snapShot[0] ) ;
        graphData[1].push( snapShot[1] ) ;
        graphData[2].push( snapShot[2] ) ;
        graphData[3].push( snapShot[3] ) ;
        graphData[4].push( snapShot[4] ) ;
        graphData[5].push( snapShot[5] ) ;
    }

    clearCanvas( divName ) ;
    const mline = new RGraph.Line({
        id: divName,
        data: graphData,
        options: {
            Background: {
                grid: false
            },
            ylabels: {
                count: 4
            },
            colors: ["#D0D0D0", "#FF0000", "#FF7F2A", "#FFFF7F", "#AAFFAA", "#00FF00"],
            filled: {self: true},
            linewidth: 0.2,
            tickmarks: false,
        }
    }).draw();
}

this.getDifficultyLevelLabel = function( level ) {

    if     ( level >= 0  && level < 30 ) { return "VE" ; }
    else if( level >= 30 && level < 50 ) { return "E"  ; }
    else if( level >= 50 && level < 75 ) { return "M"  ; }
    else if( level >= 75 && level < 90 ) { return "H"  ; }
    return "VH" ;
}

this.getLearningEfficiencyLabel = function( score ) {

    if      ( score >= 90 && score <= 100 ) { return "A1" ; }
    else if ( score >= 80 && score <  90  ) { return "A2" ; }
    else if ( score >= 70 && score <  80  ) { return "B1" ; }
    else if ( score >= 60 && score <  70  ) { return "B2" ; }
    else if ( score >= 50 && score <  60  ) { return "C1" ; }
    else if ( score >= 40 && score <  50  ) { return "C2" ; }
    else                                    { return "D"  ; }
}

this.getAbsoluteLearningEfficiency = function( temporalScores ) {

    let totalRatingScores = 0;
    let absLE = 0;

    if( temporalScores.length !== 0 ) {
        for( let i=0; i<temporalScores.length; i++ ) {
            var rating = temporalScores[i] ;
            if     ( rating === 'E' ) totalRatingScores += 100 ;
            else if( rating === 'A' ) totalRatingScores +=  80 ;
            else if( rating === 'P' ) totalRatingScores +=  50 ;
            else if( rating === 'H' ) totalRatingScores +=   0 ;
        }
        absLE = Math.ceil( totalRatingScores / temporalScores.length ) ;
    }
    return absLE ;
}

this.computeFatiguePotential = function( question ) {

    const nu = question.learningStats.absoluteLearningEfficiency;
    const recency = question.learningStats.recencyInDays;
    const attempts = question.learningStats.numAttempts;
    const avgTime = question.learningStats.averageTimeSpent;
    const diffLevel = question.difficultyLevel;

    const nuNormal = nu;
    let recencyNormal = 0;
    let attemptsNormal = 0;
    let avgTimeNormal = 0;
    const diffLevelNormal = 100 - diffLevel;

    // Compute recency normal
    if( recency === 0 ) {
        recencyNormal = 100 ;
    }
    else {
        recencyNormal = Math.round( 100 * ( 1 - Math.exp( -recency/95 ) ) ) ;
    }
    recencyNormal = 100 - recencyNormal ;

    // Compute attempts normal
    attemptsNormal = Math.round( 100 * ( 1 - Math.exp( -attempts/5 ) ) ) ;

    // Compute average time normal
    if( avgTimeNormal === 0 ) {
        avgTimeNormal = 100 ;
    }
    else {
        avgTimeNormal = Math.round( 100 * ( 1 - Math.exp( -avtTime/20 ) ) ) ;
    }
    avgTimeNormal = 100 - avgTimeNormal ;


    const NU_MULTIPLIER       = 10;
    const RECENCY_MULTIPLIER  = 20;
    const ATTEMPTS_MULTIPLIER = 8;
    const AVGTIME_MULTIPLIER  = 5;
    const DIFFLEVEL_MULTIPLIER= 10;
    const TOTAL_MULTIPLIERS   = NU_MULTIPLIER + RECENCY_MULTIPLIER +
                                         ATTEMPTS_MULTIPLIER + AVGTIME_MULTIPLIER +
                                         DIFFLEVEL_MULTIPLIER;

    const nuScore       = nuNormal * NU_MULTIPLIER;
    const recencyScore  = recencyNormal * RECENCY_MULTIPLIER;
    const attemptsScore = attemptsNormal * ATTEMPTS_MULTIPLIER;
    const avgTimeScore  = avgTimeNormal * AVGTIME_MULTIPLIER;
    const diffLevelScore= diffLevelNormal * DIFFLEVEL_MULTIPLIER;

    const total = nuScore + recencyScore + attemptsScore +
                           avgTimeScore + diffLevelScore;

    return 100 - (Math.round(total) / (TOTAL_MULTIPLIERS * 100)) * 100 ;
}

this.playSoundClip = function( clipPath ) {

    const audio = document.getElementById("audio");
    audio.src = clipPath ;
    audio.load() ;
    audio.play() ;
} ;

this.playCorrectAnswerClip = function() {
    this.playSoundClip( "/lib-app/media/audio/correct_answer.mp3" ) ;
} ;

this.playWrongAnswerClip = function() {
    this.playSoundClip( "/lib-app/media/audio/wrong_answer.mp3" ) ;
} ;

this.playKeyPressClip = function() {
    this.playSoundClip( "/lib-app/media/audio/keypress.mp3" ) ;
} ;

this.playWordSound = function( word ) {
    this.playSoundClip( "/apps/jove_notes/workspace/_spellbee/" + word + ".mp3" ) ;
}

this.getSSRThresholdDelta = function( question ) {

    const currentLevel = question.learningStats.currentLevel;
    if( currentLevel === CardLevels.prototype.NS ) {
        return -1 ;
    }

    const timeSinceLastAttempt = new Date().getTime() -
                                          question.learningStats.lastAttemptTime;
    const THRESHOLD_MAP = {
       //                   L0  L1  L2  L3
       'true_false'      : [ 1,  7, 14, 21],
       'multi_choice'    : [ 1,  7, 14, 21],
       'voice2text'      : [ 1,  7, 14, 21],
       'spellbee'        : [ 1,  7, 14, 21],
       'fib'             : [ 1,  5,  7, 14],
       'question_answer' : [ 1,  3,  5,  7],
       'matching'        : [ 1,  3,  5,  7],
       'image_label'     : [ 1,  3,  5,  7],
       'exercise'        : [ 1,  3,  5,  7]
    } ;

    const threshold = THRESHOLD_MAP[question.questionType] ;
    let thresholdIdx = -1 ;

    switch( currentLevel ) {
        case CardLevels.prototype.L0: thresholdIdx = 0; break;
        case CardLevels.prototype.L1: thresholdIdx = 1; break;
        case CardLevels.prototype.L2: thresholdIdx = 2; break;
        case CardLevels.prototype.L3: thresholdIdx = 3; break;
    }

    const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
    if( thresholdIdx != -1 ) {
        return timeSinceLastAttempt - MILLIS_IN_DAY * threshold[thresholdIdx] ;
    }
    return -1 ;
}

this.getRecencyInDays = function( question ) {

    const millis= new Date().getTime() - question.learningStats.lastAttemptTime;

    const numSecs= Math.floor(millis / 1000);
    const days = Math.floor(numSecs / (3600 * 24));

    return days ;
}

// ----------------------- Private functions for JoveNoteUtils -----------------

function isDebug() {
    return typeof __debug__ != 'undefined';

}

function clearCanvas( canvasId ) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext("2d");
    context.clearRect( 0, 0, canvas.width, canvas.height ) ;
}

// ------------------- JoveNotesUtil ends --------------------------------------
}

/**
 * Global function to play an absolute clip, without the need or dependence of
 * any scope object.
 */
function playSoundClip( clipPath ) {
    new JoveNotesUtil().playSoundClip( clipPath ) ;
}