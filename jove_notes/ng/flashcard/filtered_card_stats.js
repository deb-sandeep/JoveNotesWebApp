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

    this.computeStatistics = function() {
        for( var i=0; i<this.questions.length; i++ ) {
            var q = this.questions[i] ;
            updateNuStatistics( q, this.nuStatistics ) ;
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
}