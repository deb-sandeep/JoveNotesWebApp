function VoiceToTextManager( questionObj, textFormatter, $scope ) {

	var questionDiv = null ;
	var answerDiv   = null ;
	var audio       = null ;
	var jnUtils     = new JoveNotesUtil() ;
	var clipName    = questionObj.clipName ;
	var fmtAnswer   = textFormatter.format( questionObj.text ) ;

	this.initialize = function() {

		audio = document.getElementById( "audio" ) ;
		prepareQuestionUI() ;
		prepareAnswerUI() ;

		playPressed() ;
	} ;

	this.getQuestionUI = function() {
		return questionDiv ;
	}

	this.freezeQuestionUI = function() {}

	this.getAnswerUI = function() {
		return answerDiv ;
	}

	this.initializeAnswerUI = function() {} ;

	//-------------------------------------------------------------------------
	var prepareQuestionUI = function() {

		var captionHTML = "<h3>Write the following sound clip:</h3><p>" ;
		var btnHTML = "<span class='glyphicon glyphicon-play gi-2x'></span>" ;

		var questionP = P( { innerHTML : captionHTML } ) ;
		var playBtn   = BUTTON( { 'class'     : 'btn btn-success btn-lg',
	                              'innerHTML' :  btnHTML
	                            }
			                  ) ;

		playBtn.onclick = playPressed ;

		questionDiv = DIV( questionP, playBtn ) ;
	}

	var prepareAnswerUI = function() {

		var answerP = P( { innerHTML : fmtAnswer } ) ;
		answerDiv = DIV( answerP ) ;
	}

	var playPressed = function() {

		audio.src = "/apps/jove_notes/workspace/_spellbee/" + clipName + ".mp3" ;
		audio.load() ;
		audio.play() ;
	} ;
} ;
