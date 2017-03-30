function CardStatistics( questions ) {

    this.questions = questions ;
    this.nuStatistics = {
        "XX" : [ 0, "#00FF08" ],
        "A1" : [ 0, "#52C300" ],
        "A2" : [ 0, "#8FA700" ],
        "B1" : [ 0, "#E58E00" ],
        "B2" : [ 0, "#DD7400" ],
        "C1" : [ 0, "#EF5300" ],
        "C2" : [ 0, "#CD2900" ],
        "D"  : [ 0, "#FF0000" ]
    } ;

    this.levelStatistics = {
        "NS" : [0, "#D0D0D0" ],
        "L0" : [0, "#FF0000" ],
        "L1" : [0, "#FF7F2A" ],
        "L2" : [0, "#FFFF7F" ],
        "L3" : [0, "#AAFFAA" ]
    }

    this.recencyStatistics = {
        "1W"  : [0, "#3137FF" ],
        "2W"  : [0, "#7172FF" ],
        "3W"  : [0, "#9F58FF" ],
        "4W"  : [0, "#F952FF" ],
        "1M+" : [0, "#FF1DA3" ]
    }

    this.computeStatistics = function() {
        for( var i=0; i<this.questions.length; i++ ) {
            var q = this.questions[i] ;
            updateNuStatistics( q, this.nuStatistics ) ;
            updateLevelStatistics( q, this.levelStatistics ) ;
            updateRecencyStatistics( q, this.recencyStatistics ) ;
        }
    }

    function updateNuStatistics( question, nuStatistics ) {
        var effLabel = question.learningStats.efficiencyLabel ;
        if( effLabel == 'A1' ) {
            if( question.learningStats.absoluteLearningEfficiency == 100 ) {
                nuStatistics[ 'XX' ][0]++ ;
            }
            else {
                nuStatistics[ effLabel ][0]++ ;
            }
        }
        else {
            nuStatistics[ effLabel ][0]++ ;
        }
    }

    function updateLevelStatistics( question, levelStatistics ) {
        levelStatistics[ question.learningStats.currentLevel ][0] ++        
    }

    function updateRecencyStatistics( question, recencyStatistics ) {
        var elapsedDays = question.learningStats.recencyInDays ;
        if( elapsedDays < 7 ) {
            recencyStatistics[ '1W'][0]++ ;
        }
        else if( elapsedDays < 7*2 ) {
            recencyStatistics[ '2W'][0]++ ;
        }
        else if( elapsedDays < 7*3 ) {
            recencyStatistics[ '3W'][0]++ ;
        }
        else if( elapsedDays < 7*4 ) {
            recencyStatistics[ '4W'][0]++ ;
        }
        else {
            recencyStatistics[ '1M+'][0]++ ;
        }
    }
}