function VirtualTextFieldKeyboardWidget( pronunciation, keyboardConfig, numEntryCells ) {

	var keyboardConfig = keyboardConfig ;
	var numEntryCells  = numEntryCells ;

	var virtualTextFieldCells   = [] ;
	var virtualTextFieldCellData= [] ;
	var keyPressCallbackMethods = [] ;
	var keyCodeButtonDOMMap     = [] ;
	var currentVTFCellIndex     = -1 ;

	this.divDOM = null ;

	this.initialize = function() {

		this.divDOM = DIV( { align : 'center', id : '_spellbeediv' },
						H5( 'Spell Bee - ' + pronunciation ),
						this.getVirtualTextFieldDOM(),
						P(),
						this.getVirtualKeyBoardDOM()
					 ) ;
	} ;

	this.getVirtualTextFieldDOM = function() {

		return TABLE( TBODY(
				TR.map( ['a'], function( obj ){
					for( var i=0; i<numEntryCells; i++ ) {
						virtualTextFieldCells.push( TD( { class : 'vtf_cell well' } ) ) ;
					}
					return virtualTextFieldCells ;
				}))) ;
	} ;

	this.getVirtualKeyBoardDOM = function() {

		var tableDOM = TABLE() ;
		var tBody = tableDOM.createTBody() ;

		for( var rowNum = 0; rowNum < keyboardConfig.length; rowNum++ ) {

			var kbRow = keyboardConfig[rowNum] ;
			var tr = tBody.insertRow() ;

			for( var keyNum=0; keyNum < kbRow.length; keyNum++ ) {
				var key = kbRow[ keyNum ] ;

				var keyCode = key[0] ;
				var display = ( key.length > 1 )? key[1] : keyCode ;

				var cell = tr.insertCell() ;
				if( key.length > 2 ) cell.colSpan = key[2] ;
				if( key.length > 3 ) cell.rowSpan = key[3] ;

				var button = BUTTON( { class : "btn btn-default btn-spellbee" } ) ;
				button.innerHTML = display ;
				
				cell.appendChild( button ) ;

			    keyPressCallbackMethods[ keyCode ] = this.defaultKeyPressCallback ;
			    keyCodeButtonDOMMap[ keyCode ] = button ;

				this.addButtonEventListener( button, keyCode ) ;
			}
		}
		return tableDOM ;
	} ;

	this.addButtonEventListener = function( button, keyCode ) {
		button.onclick = function() {
			var callbackfn = keyPressCallbackMethods[ keyCode ] ;
			callbackfn( keyCode ) ;
		} ;
	} ;

	this.defaultKeyPressCallback = function( keyCode ) {
		
		if( keyCode == "VK_BKSP" ) {
			if( currentVTFCellIndex > -1 ) {
				virtualTextFieldCells[ currentVTFCellIndex ].innerHTML = '' ;
				currentVTFCellIndex-- ;
			}
		}
		else if( keyCode == "VK_CLR_VTF" ) {
			while( currentVTFCellIndex > -1 ) {
				virtualTextFieldCells[ currentVTFCellIndex ].innerHTML = '' ;
				currentVTFCellIndex-- ;
			}
		}
		else {
			if( currentVTFCellIndex < numEntryCells-1 ) {
				currentVTFCellIndex++ ;
				virtualTextFieldCellData[ currentVTFCellIndex ] = keyCode ;
				virtualTextFieldCells[ currentVTFCellIndex ].innerHTML = keyCode ;
			}
		}
	} ;

	this.registerKeyPressCallback = function( keyCode, callbackfn ) {
		keyPressCallbackMethods[ keyCode ] = callbackfn ;
	} ;

	this.getEnteredText = function() {
		var text = "" ;
		for( var i=0; i<=currentVTFCellIndex; i++ ) {
			text += virtualTextFieldCellData[i] ;
		}
		return text ;
	} ;

	this.clearVirtualTextField = function() {
		while( currentVTFCellIndex > -1 ) {
			virtualTextFieldCells[ currentVTFCellIndex ].innerHTML = '' ;
			currentVTFCellIndex-- ;
		}
	} ;

	this.setVirtualTextFieldBackground = function( color ) {
		for( var i=0; i<numEntryCells; i++ ) {
			virtualTextFieldCells[i].style.backgroundColor = color ;
		}
	} ;

	this.clearVirtualTextFieldBackground = function() {
		this.setVirtualTextFieldBackground( "initial" ) ;
	} ;

	this.disableKeyboard = function() {
		for( var key in keyCodeButtonDOMMap ) {
		  	keyCodeButtonDOMMap[ key ].disabled = true ;
		}
	} ;

	this.enableKeyboard = function() {
		for( var key in keyCodeButtonDOMMap ) {
		  	keyCodeButtonDOMMap[ key ].disabled = false ;
		}
	} ;

	this.enableKey = function( keyCode ) {
		keyCodeButtonDOMMap[ keyCode ].disabled = false ;
	} ;

	this.disableKey = function( keyCode ) {
		keyCodeButtonDOMMap[ keyCode ].disabled = true ;
	} ;
} ;

function SpellBeeManager( questionObj, $scope ) {

	var sbKeys = [
		[
			['VK_PLAY', '>>', 1, 3 ],
			['Q'],['W'],['E'],['R'],['T'],['Y'],['U'],['I'],['O'],['P'],
			['VK_ENTER', '&crarr;', 1, 3 ]
		],
		[
			['A'],['S'],['D'],['F'],['G'],['H'],['J'],['K'],['L'],
			['VK_CLR_VTF', '(X)']
		],
		[
			['Z'],['X'],['C'],['V'],['B'],['N'],['M'],
			['VK_BKSP', '&larr;', 3, 1]
		]
	] ;

	var wordToBeSpelled = questionObj.word ;
	var inputWidget = null ;
	var audio = null ;
	var jnUtils = new JoveNotesUtil() ;
	var answeredCorrectly = true ;

	this.answerLength = questionObj.word.length ;

	this.initialize = function() {

		inputWidget = new VirtualTextFieldKeyboardWidget( questionObj.pronunciation, sbKeys, 17 ) ;
		audio = document.getElementById( "audio" ) ;

		inputWidget.initialize() ;
		inputWidget.registerKeyPressCallback( 'VK_ENTER', this.enterPressed ) ;
		inputWidget.registerKeyPressCallback( 'VK_PLAY',  this.playPressed ) ;

		this.playPressed( null ) ;
	} ;

	this.enterPressed = function( keyCode ) {

		if( inputWidget.getEnteredText().toUpperCase() == wordToBeSpelled.toUpperCase() ) {
			jnUtils.playCorrectAnswerClip() ;
			inputWidget.setVirtualTextFieldBackground( "lightgreen" ) ;
			answeredCorrectly = true ;
			$scope.showAnswer() ;
		}
		else {
			jnUtils.playWrongAnswerClip() ;
			inputWidget.setVirtualTextFieldBackground( "red" ) ;
			answeredCorrectly = false ;
			$scope.showAnswer() ;
		}
	} ;

	this.playPressed = function( keyCode ) {

		audio.src = "/apps/jove_notes/workspace/_spellbee/" + wordToBeSpelled.toLowerCase() + ".mp3" ;
		audio.load() ;
		audio.play() ;
	} ;
	
	this.getQuestionUI = function() {
		return inputWidget.divDOM ;
	}

	this.freezeQuestionUI = function() {
		inputWidget.disableKeyboard() ;
		inputWidget.enableKey( 'VK_PLAY' ) ;
	}

	this.getAnswerUI = function() {
		return DIV( { id : "_spellbeediv_ansdiv" },
		            DIV( { id : "_spellbeediv_ansdiv_spelling" } ),
		            DIV( { id : "_spellbeediv_ansdiv_meaning" } ) ) ;
	}

	this.initializeAnswerUI = function() {
		
		var ansSpellingDivDOM = document.getElementById( "_spellbeediv_ansdiv_spelling" ) ;
		var ansMeaningDivDOM  = document.getElementById( "_spellbeediv_ansdiv_meaning" ) ;
		
		ansSpellingDivDOM.innerHTML = wordToBeSpelled.toUpperCase() ;

		$.ajax({
            type: 'GET',
            url: "/apps/jove_notes/workspace/_spellbee/" + wordToBeSpelled.toLowerCase() + ".descr"
        })
        .done( function( responseStr ) {
            ansMeaningDivDOM.innerHTML = responseStr ;
        }) ;         
	} ;

} ;
