function HotSpot( x, y, label ) {

	this.x = x ;
	this.y = y ;
	this.label = label ;

	this.matched = false ;
	this.numIncorrectAttempts = 0 ;

	this.rwIndSpan   = null ;
	this.labelIdSpan = null ;
	this.labelSpan   = null ;
	this.id          = 0 ;

	this.attachSpans = function( rwIndSpan, labelIdSpan, labelSpan ) {
		this.rwIndSpan   = rwIndSpan ;
		this.labelIdSpan = labelIdSpan ;
		this.labelSpan   = labelSpan ;
	} ;

	this.setLabelSelected = function( selected ) {
		if( selected ) {
			this.labelIdSpan.setAttribute( "class", "label_id_selected" ) ;
			this.labelSpan.setAttribute(   "class", "label_selected" ) ;
		}
		else {
			if( !this.matched ) {
				this.labelIdSpan.setAttribute( "class", "label_id_unmatched" ) ;
				this.labelSpan.setAttribute(   "class", "label_unmatched" ) ;
			}
		}
	} ;

	this.setLabelMatched = function() {
		this.matched = true ;
		this.labelIdSpan.setAttribute( "class", "label_id_matched" ) ;
		this.labelSpan.setAttribute(   "class", "label_matched" ) ;
	} ;

	this.renderResult = function() {
		if( this.numIncorrectAttempts == 0 ) {
			this.rwIndSpan.setAttribute( "class", "result_ind_right" ) ;
		}
		else {
			this.rwIndSpan.setAttribute( "class", "result_ind_wrong" ) ;
		}
	} ;

	this.renderHotspotOnCanvas = function( canvas ) {

		var context = canvas.getContext( "2d" ) ;
		
		context.beginPath() ;
		context.arc( this.x, this.y, 20, 0, 2 * Math.PI, false ) ;
		context.fillStyle = '#00FF00' ;
		context.fill() ;
		context.lineWidth = 1 ;
		context.strokeStyle = '#003300';
		context.stroke();	

		context.font = '15pt Verdana';
		context.fillStyle = '#000000' ;
		context.fillText( this.id, this.x - 8,  this.y + 8 ) ;		
	} ;
}

// -----------------------------------------------------------------------------
function ImageLabelManager( questionObj, textFormatter, $scope ) {

	this.questionObj = questionObj ;
	this.caption     = null ;
	this.imgPath     = null ;
	this.numHotSpots = 0 ;
	this.hotspotsAssociativeArray = [] ;
	this.numHotSpotsLeftToMatch = 0 ;
	this.numTotalIncorrectAttempts = 0 ;
	this.labelsArray = [] ;
	this.answerLength = 0 ;
	this.answeredCorrectly = false ;

	this.selectedHotspot = null ;

	var jnUtils = new JoveNotesUtil() ;

	this.initialize = function() {

		this.caption     = textFormatter.format( this.questionObj.caption ) ;
		this.imgPath     = textFormatter.getAbsolutePathForImage( this.questionObj.imageName ) ;
		this.numHotSpots = this.questionObj.hotSpots.length ;
		this.numHotSpotsLeftToMatch = this.numHotSpots ;

		var hotSpots = this.questionObj.hotSpots ;
		for( var i=0; i<hotSpots.length; i++ ) {

			var hsX = hotSpots[i][0] ;
			var hsY = hotSpots[i][1] ;
			var hsLabel = hotSpots[i][2] ;

			this.answerLength += hsLabel.length ;

			var hotspot = new HotSpot( hsX, hsY, hsLabel ) ;

			this.hotspotsAssociativeArray[ hsLabel ] = hotspot ;
			this.labelsArray.push( hsLabel ) ;
		}
		this.labelsArray.shuffle() ;
	} ;

	this.getQuestionUI = function() {
		return this.getUIDOM( true ) ;
	} ;

	this.getAnswerUI = function() {
		if( this.answeredCorrectly ) {
			return DIV() ;
		}
		return this.getUIDOM( false ) ;
	}

	//  <table>
	//    <caption>$this.caption$</caption>
	//    <tbody>
	//      <tr>
	//        <td>
	//           This is where the canvas goes
	//        </td>
	//        <td>
	//           This is there the vertical table 
	//           with hotspot labels go
	//        </td>
	//      </tr>
	//    </tbody>
	//  </table>
	this.getUIDOM = function( isQuestion ) {

		var tableDOM = document.createElement( "table" ) ;

		if( isQuestion ) {
			tableDOM.createCaption().innerHTML = this.caption ;
		}

		var tBody    = tableDOM.createTBody() ;
		var tr       = tBody.insertRow() ;
		var tdCanvas = tr.insertCell() ;
		var tdLabels = tr.insertCell() ;

		tdCanvas.appendChild( this.getCanvasDOM( isQuestion ) ) ;
		tdLabels.appendChild( this.getLabelsDOM( isQuestion ) ) ;

		divDOM = document.createElement( "div" ) ;
		divDOM.setAttribute( "class", "jove_imglabel_div" ) ;
		divDOM.appendChild( tableDOM ) ;

		return divDOM ;
	}

	this.getCanvasDOM = function( isQuestion ) {

        var canvas = document.createElement( "canvas" ) ;

        canvas.id     = isQuestion ? "imglabel_q_canvas" : "imglabel_a_canvas" ;
        canvas.width  = 200 ; // Initial height and width, will be reset on
        canvas.height = 200 ; // image load.

        var $this = this ;
        var image = new Image() ;
        image.src = this.imgPath ;
        image.onload = function() {

	        var context = canvas.getContext( "2d" ) ;
            canvas.width  = image.width ;
            canvas.height = image.height ;
            context.drawImage( image, 0, 0 ) ;

            if( !isQuestion ) {
	            for( var i=0; i<$this.labelsArray.length; i++ ) {
	            	$this.hotspotsAssociativeArray[ $this.labelsArray[i] ]
	            		.renderHotspotOnCanvas( canvas ) ;
	            }
            }
        } ;

        if( isQuestion ) {
	        var thisObj = this ;
	        canvas.addEventListener( "mousedown", function( e ) {
	        	thisObj.canvasClicked( e ) ;
	        }, false ) ;
        }
        return canvas ;
	} ;

	this.getLabelsDOM = function( isQuestion ) {
		
		var tableDOM = document.createElement( "table" ) ;
		tableDOM.setAttribute( "class", "label_table" ) ;

		var tBody = tableDOM.createTBody() ;
		for( var i=0; i<this.numHotSpots; i++ ) {

			var tr    = tBody.insertRow() ;
			var label = this.labelsArray[i] ;

			var rwIndSpan   = createLabelTableSpan( "result_ind_empty",   "&nbsp;" ) ;
			var labelIdSpan = createLabelTableSpan( "label_id_unmatched", (i+1) + " - &nbsp;" ) ;
			var labelSpan   = createLabelTableSpan( "label_unmatched",    label ) ;

			tr.insertCell().appendChild( rwIndSpan   ) ;
			tr.insertCell().appendChild( labelIdSpan ) ;
			tr.insertCell().appendChild( labelSpan   ) ;

			var hotspot = this.hotspotsAssociativeArray[ label ] ;
			hotspot.attachSpans( rwIndSpan, labelIdSpan, labelSpan ) ;
			hotspot.id = i+1 ;

			if( isQuestion ) {
				this.attachOnClickHandler( labelIdSpan, hotspot ) ;
				this.attachOnClickHandler( labelSpan,   hotspot ) ;
			}
		}

		return tableDOM ;
	} ;

	this.attachOnClickHandler = function( span, hotspot ) {
		
		var thisObj = this ;
		span.onclick = function() {
			thisObj.labelClicked( hotspot ) ;
		} ;
	} ;

	this.labelClicked = function( hotspot ) {
		
		if( !hotspot.matched ) {
			if( this.selectedHotspot != null ) {
				if( this.selectedHotspot.label != hotspot.label ) {

					this.selectedHotspot.setLabelSelected( false ) ;
					hotspot.setLabelSelected( true ) ;
					this.selectedHotspot = hotspot ;
				}
			}
			else {
				this.selectedHotspot = hotspot ;
				hotspot.setLabelSelected( true ) ;
			}
		}
	} ;

	this.canvasClicked = function( e ) {

		if( this.selectedHotspot != null ) {

			var canvas = document.getElementById( "imglabel_q_canvas" ) ;
			var rect   = canvas.getBoundingClientRect() ;
			var clickX = e.clientX - rect.left ;
			var clickY = e.clientY - rect.top ;

			// Taking away the feature that a canvas click is considered valid only if it is
			// within one of the hot zones. This is because the canavas can have honeypots - 
			// which are decorative hospots to confuse the student :) We don't want the student
			// to start clicking everywhere till they find the right answer and that too without
			// any penalty.
			
			// if( !this.isValidClick( clickX, clickY ) ) {
			// 	return ;
			// }

			var distance = getDistance( this.selectedHotspot.x, this.selectedHotspot.y,
				                        clickX, clickY ) ;
			if( distance <= 20 ) {

				this.selectedHotspot.renderResult() ;
				this.selectedHotspot.setLabelMatched() ;
				this.selectedHotspot.renderHotspotOnCanvas( canvas ) ;
				this.selectedHotspot = null ;
				
				this.numHotSpotsLeftToMatch-- ;
				
				if( this.numHotSpotsLeftToMatch <= 0 ) {
					$scope.showAnswer() ;
					if( this.numTotalIncorrectAttempts == 0 ) {
						this.answeredCorrectly = true ;
						jnUtils.playCorrectAnswerClip() ;
					}
					else {
						this.answeredCorrectly = false ;
						jnUtils.playWrongAnswerClip() ;
					}
				}
			}
			else {
				this.selectedHotspot.numIncorrectAttempts++ ;
				this.numTotalIncorrectAttempts++ ;
				this.selectedHotspot.renderResult() ;
			}
		}
	} ;

	this.isValidClick = function( x, y ) {

		for( var hsLabel in this.hotspotsAssociativeArray ){
		    var hs = this.hotspotsAssociativeArray[ hsLabel ] ;
		    if( getDistance( hs.x, hs.y, x, y ) <= 20 ) {
		    	return true ;
		    }
		}	
		return false ;	
	}

	var getDistance = function( x1, y1, x2, y2 ) {
		return Math.sqrt( Math.pow( (x2-x1), 2 ) + Math.pow( (y2-y1), 2 ) ) ;
	} ;

	var createLabelTableSpan = function( cls, text ) {
		var span = SPAN( { class : cls } ) ;
		span.innerHTML = text ;
		return  span ;
	} ;
} ;

