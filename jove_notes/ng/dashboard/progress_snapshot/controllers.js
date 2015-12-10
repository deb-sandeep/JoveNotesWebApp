dashboardApp.controller( 'ProgressSnapshotController', function( $scope, $http ) {
// -----------------------------------------------------------------------------

RowData.prototype.ROW_TYPE_SYLLABUS = 0 ;
RowData.prototype.ROW_TYPE_SUBJECT  = 1 ;
RowData.prototype.ROW_TYPE_CHAPTER  = 2 ;

function RowData( rowType, name, rowId, parentRowId ) {

	this.rowType     = rowType ;
	this.name        = name ;
	this.rowId       = String( rowId ).replace( / +/g, "-" ) ;
	this.parentRowId = parentRowId ;
	this.isHidden    = true ;
	this.children    = [] ;

    this.isNotesAuthorized      = false ;
    this.isFlashcardAuthorized  = false ;
    this.isStatisticsAuthorized = false ;
    this.isDeleteAuthorized     = false ;

	this.totalCards         = 0 ;
	this.notStartedCards    = 0 ;
	this.l0Cards            = 0 ;
	this.l1Cards            = 0 ;
	this.l2Cards            = 0 ;
	this.l3Cards            = 0 ;
	this.masteredCards      = 0 ;
	this.numSSRMaturedCards = 0 ;

	this.chapter    = null ;
	this.chapterId  = null ;
	this.subjectRD  = null ;
	this.syllabusRD = null ;

	this.isRowSelected = true ;

	this.isChapterRow = function() {
		return this.rowType == this.ROW_TYPE_CHAPTER ;
	}

	this.addChild = function( childRow ) {
		this.children.push( childRow ) ;
	}

	this.selectionChanged = function() {
		var affectedChapterIds = [] ;

		if( !this.isChapterRow() ) {
			for( var i=0; i<this.children.length; i++ ) {
				this.children[i].isRowSelected = this.isRowSelected ;
				var affectedIds = this.children[i].handleSelectionChangeCascade() ;

				affectedChapterIds = affectedChapterIds.concat( affectedIds ) ;
			}
		}
		else {
			affectedChapterIds.push( this.chapterId ) ;
		}

		$http.post( "/jove_notes/api/ProgressSnapshot", {
			'action'         : 'update_selection',
			'chapterIds'     : affectedChapterIds.join(),
			'selectionState' : this.isRowSelected
		} )
		.error( function( data ){
			$scope.addErrorAlert( "API call failed. " + data ) ;
		});
		recomputeStatistics() ;
	}

	this.handleSelectionChangeCascade = function() {

		var affectedChapterIds = [] ;

		if( !this.isChapterRow() ) {
			for( var i=0; i<this.children.length; i++ ) {
				var child = this.children[i] ;
				child.isRowSelected = this.isRowSelected ;
				var affectedIds = child.handleSelectionChangeCascade() ;

				affectedChapterIds = affectedChapterIds.concat( affectedIds ) ;
			}
		}
		else {
			if( !this.isHidden ) {
				affectedChapterIds.push( this.chapterId ) ;
			}
		}
		return affectedChapterIds ;
	}

	this.toggleVisibility = function() {
		this.isHidden = !this.isHidden ;
		$http.post( "/jove_notes/api/ProgressSnapshot", {
			'action'    : 'update_visibility',
			'chapterId' : this.chapterId,
			'isHidden'  : this.isHidden
		} )
		.error( function( data ){
			$scope.addErrorAlert( "API call failed. " + data ) ;
		});
	    recomputeStatistics() ;
	}

	this.setChapterAndParentRows = function( chapter, subjectRD, syllabusRD ) {

		this.chapter     = chapter ;
		this.chapterId   = chapter.chapterId ;

		this.subjectRD   = subjectRD ;
		this.syllabusRD  = syllabusRD ;

		this.totalCards          = chapter.totalCards ;
		this.notStartedCards     = chapter.notStartedCards ;
		this.l0Cards             = chapter.l0Cards ;
		this.l1Cards             = chapter.l1Cards ;
		this.l2Cards             = chapter.l2Cards ;
		this.l3Cards             = chapter.l3Cards ;
		this.masteredCards       = chapter.masteredCards ;
		this.numSSRMaturedCards  = chapter.numSSRMaturedCards ;

		this.isNotesAuthorized      = chapter.isNotesAuthorized ;
		this.isFlashcardAuthorized  = chapter.isFlashcardAuthorized ;
		this.isStatisticsAuthorized = chapter.isStatisticsAuthorized ;
		this.isDeleteAuthorized     = chapter.isDeleteAuthorized ;
		this.isHidden               = chapter.isHidden ;
		this.isRowSelected          = !chapter.isDeselected ;
	}
}

$scope.$parent.pageTitle     = "Progress Dashboard" ;
$scope.$parent.currentReport = 'ProgressSnapshot' ;
$scope.showHiddenChapters    = false ;
$scope.showOnlySelectedRows  = false ;
$scope.progressSnapshot      = null ;

refreshData() ;

$scope.refreshData = function() {
	refreshData() ;
}

$scope.getTreeRowClass = function( rowData ) {
	var classStr = "treegrid-" + rowData.rowId ;
	if( rowData.parentRowId != -1 ) {
		classStr += " treegrid-parent-" + rowData.parentRowId ;
	}

	switch( rowData.rowType ) {
		case RowData.prototype.ROW_TYPE_SYLLABUS:
			classStr += " info" ;
			break ;
		case RowData.prototype.ROW_TYPE_SUBJECT:
			classStr += " active" ;
			break ;
	}
	return classStr ;
}

$scope.isTreeRowVisible = function( rowData ) {

	if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
		if( rowData.isHidden ) {
			if( !$scope.showHiddenChapters ) {
				return false ;
			}
		}
	}

	if( $scope.showOnlySelectedRows ) {
		if( !rowData.isRowSelected ) {
			return false ;
		}
	}
	return true ;
}

$scope.expandAll = function() {
	$('.tree').treegrid('expandAll') ;
}

$scope.collapseAll = function() {
	$('.tree').treegrid('collapseAll') ;
}

$scope.toggleHiddenChapters = function() {
	$scope.showHiddenChapters = !$scope.showHiddenChapters ;
	$http.put( "/__fw__/api/UserPreference", {
		'jove_notes.showHiddenChapters' : $scope.showHiddenChapters ? 'true' : 'false'
	} )
	.success( function( data ){
		log.debug( "Updated user preference for showHiddenChapters." ) ;
	} )
	.error( function( data ){
		log.error( "Could not set hidden chapter preferences for user." ) ;
	});  
    recomputeStatistics() ;
}

$scope.toggleShowSelectedRows = function() {
	$scope.showOnlySelectedRows = !$scope.showOnlySelectedRows ;
	$http.put( "/__fw__/api/UserPreference", {
		'jove_notes.showOnlySelectedRows' : $scope.showOnlySelectedRows ? 'true' : 'false'
	} )
	.success( function( data ){
		log.debug( "Updated user preference for showOnlySelectedRows" ) ;
	} )
	.error( function( data ){
		log.error( "Could not set hidden chapter preferences for user." ) ;
	});  
	recomputeStatistics() ;
}

$scope.deleteChapter = function( chapterId ) {

	bootbox.confirm( "<h3>Are you sure you want to delete this chapter?</h3>" + 
		             "All notes, cards and student histories will be deleted.<br>" + 
		             "Please confirm.", 
		function( okSelected ) {
			if( okSelected ) {
				$http.delete( "/jove_notes/api/Chapter/" + chapterId )
			         .success( function( data ){
			         	if( data != null && data.trim() == "Success" ) {
			         		removeChapter( chapterId ) ;
			         	}
			         	else {
			         		$scope.addErrorAlert( "API call failed. '" + data + "'." ) ;
			         	}
			         })
			         .error( function( data ){
			         	$scope.addErrorAlert( "API call failed. " + data ) ;
			         });
			}
		}) ;
}

$scope.$on( 'onRenderComplete', function( scope ){
    $('.tree').treegrid({
      'initialState': 'collapsed',
      'saveState': true,
      'saveStateName' : "treeState-" + currentUserName 
    });	
    recomputeStatistics() ;
   	$scope.$digest() ;
} ) ;

function removeChapter( chapterId ) {

	var chapterRowIndex = -1 ;
	for( var i=0; i<$scope.progressSnapshot.length; i++ ) {
		var rowData = $scope.progressSnapshot[i] ;
		if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER &&
			rowData.chapterId == chapterId ) {

			chapterRowIndex = i ;
			break ;
		}
	}

	if( chapterRowIndex != -1 ) {
		$scope.progressSnapshot.splice( chapterRowIndex, 1 ) ;
		recomputeStatistics() ;
	}
}

function refreshData() {
	$http.get( "/jove_notes/api/ProgressSnapshot" )
         .success( function( data ){
         	digestPreferences( data.preferences ) ;
         	$scope.progressSnapshot = prepareDataForDisplay( data.dashboardContent ) ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function digestPreferences( preferences ) {
	$scope.showHiddenChapters   = preferences[ "jove_notes.showHiddenChapters" ] ;
	$scope.showOnlySelectedRows = preferences[ "jove_notes.showOnlySelectedRows" ] ;
}

function prepareDataForDisplay( rawData ) {

	var displayData = [] ;
	var rowNum = 0 ;

	for( sylIndex=0; sylIndex<rawData.length; sylIndex++ ) {

		rowNum++ ;
		var syllabus = rawData[ sylIndex ] ;
		var syllabusRD = new RowData( RowData.prototype.ROW_TYPE_SYLLABUS, 
			                          syllabus.syllabusName, 
			                          syllabus.syllabusName, -1 ) ;

		displayData.push( syllabusRD ) ;

		var numSubjectsSelected = 0 ;

		for( subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

			rowNum++ ;
			var subject = syllabus.subjects[ subIndex ] ;
			var subjectRD = new RowData( RowData.prototype.ROW_TYPE_SUBJECT, 
				                         subject.subjectName, 
				                         syllabus.syllabusName + "-" + subject.subjectName, 
				                         syllabusRD.rowId ) ;

			syllabusRD.addChild( subjectRD ) ;
			displayData.push( subjectRD ) ;

			var numChaptersSelected = 0 ;
			for( chpIndex=0; chpIndex<subject.chapters.length; chpIndex++ ) {

				rowNum++ ;
				var chapter = subject.chapters[ chpIndex  ] ;
				var displayName = chapter.chapterNum + "." + chapter.subChapterNum + 
				                  " - " + chapter.chapterName ;
				var chapterRD = new RowData( RowData.prototype.ROW_TYPE_CHAPTER, 
					                         displayName, 
					                         chapter.chapterId, 
					                         subjectRD.rowId ) ;

				chapterRD.setChapterAndParentRows( chapter, subjectRD, syllabusRD ) ;

				subjectRD.addChild( chapterRD ) ;
				displayData.push( chapterRD ) ;

				if( !chapterRD.isHidden && chapterRD.isRowSelected ) {
					numChaptersSelected++ ;
				}
			}

			subjectRD.isRowSelected = ( numChaptersSelected > 0 ) ;
			if( subjectRD.isRowSelected ) numSubjectsSelected++ ;
		}

		syllabusRD.isRowSelected = ( numSubjectsSelected > 0 ) ;
	}
	return displayData ;
}

function recomputeStatistics() {

	clearRowDataAttributes() ;
	computeAggregateFlashCardChapterList() ;
	refreshProgressBars() ;
}

function clearRowDataAttributes() {

	for( var i=0; i<$scope.progressSnapshot.length; i++ ) {
		var rowData = $scope.progressSnapshot[i] ;
		if( rowData.rowType != RowData.prototype.ROW_TYPE_CHAPTER ) {

			rowData.totalCards         = 0 ;
			rowData.notStartedCards    = 0 ;
			rowData.l0Cards            = 0 ;
			rowData.l1Cards            = 0 ;
			rowData.l2Cards            = 0 ;
			rowData.l3Cards            = 0 ;
			rowData.masteredCards      = 0 ;
			rowData.numSSRMaturedCards = 0 ;

			rowData.chapterId              = null ;
    		rowData.isFlashcardAuthorized  = false ;
		}
	}
}

function computeAggregateFlashCardChapterList() {

	var curSyllabusRD = null ;
	var curSubjectRD  = null ;

	var chaptersForSyllabus = null ;
	var chaptersForSubject  = null ;

	for( var i=0; i<$scope.progressSnapshot.length; i++ ) {
		var rowData = $scope.progressSnapshot[i] ;

		if( rowData.rowType == RowData.prototype.ROW_TYPE_SYLLABUS ) {
			if( curSyllabusRD != null ) {
				if( chaptersForSyllabus.length > 0 ) {
					chaptersForSyllabus.shuffle() ;
					curSyllabusRD.chapterId = chaptersForSyllabus.join() ;
					curSyllabusRD.isFlashcardAuthorized = true ;
				}

				var selected = false ;
				for( var j=0; j<curSyllabusRD.children.length; j++ ) {
					var child = curSyllabusRD.children[j] ;
					if( !child.isHidden && child.isRowSelected ) {
						selected = true ;
						break ;
					}
				}
				curSyllabusRD.isRowSelected = selected ;
			}
			curSyllabusRD = rowData ;
			chaptersForSyllabus = [] ;
		}
		else if( rowData.rowType == RowData.prototype.ROW_TYPE_SUBJECT ) {
			if( curSubjectRD != null ) {
				if( chaptersForSubject.length > 0 ) {
					chaptersForSubject.shuffle() ;
					curSubjectRD.chapterId = chaptersForSubject.join() ;
					curSubjectRD.isFlashcardAuthorized = true ;
				}

				var selected = false ;
				for( var j=0; j<curSubjectRD.children.length; j++ ) {
					var child = curSubjectRD.children[j] ;
					if( !child.isHidden && child.isRowSelected ) {
						selected = true ;
						break ;
					}
				}
				curSubjectRD.isRowSelected = selected ;
			}
			curSubjectRD = rowData ;
			chaptersForSubject = [] ;
		}
		else if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
			if( $scope.isTreeRowVisible( rowData ) ) {

				var chapter = rowData.chapter ;

				updateCardCounts( chapter, rowData.subjectRD, rowData.syllabusRD ) ;

				if( chapter.isFlashcardAuthorized && chapter.numSSRMaturedCards > 0 ) {
					chaptersForSubject.push( chapter.chapterId ) ;
					chaptersForSyllabus.push( chapter.chapterId ) ;
				}
			}
		}
	}

	if( chaptersForSyllabus.length > 0 ) {
		chaptersForSyllabus.shuffle() ;
		curSyllabusRD.chapterId = chaptersForSyllabus.join() ;
		curSyllabusRD.isFlashcardAuthorized = true ;
	}

	if( chaptersForSubject.length > 0 ) {
		chaptersForSubject.shuffle() ;
		curSubjectRD.chapterId = chaptersForSubject.join() ;
		curSubjectRD.isFlashcardAuthorized = true ;
	}
}

function refreshProgressBars() {

	for( var i=0; i<$scope.progressSnapshot.length; i++ ) {
		var rowData = $scope.progressSnapshot[i] ;
		if( $scope.isTreeRowVisible( rowData ) ) {
			drawProgressBar( "canvas-" + rowData.rowId, 
							 rowData.totalCards,
							 rowData.notStartedCards,
							 rowData.l0Cards,
							 rowData.l1Cards,
							 rowData.l2Cards,
							 rowData.l3Cards,
							 rowData.masteredCards
				            ) ;
		}
	}
}

function updateCardCounts( chapter, subjectRD, syllabusRD ) {

	subjectRD.totalCards          += chapter.totalCards ;
	subjectRD.notStartedCards     += chapter.notStartedCards ;
	subjectRD.l0Cards             += chapter.l0Cards ;
	subjectRD.l1Cards             += chapter.l1Cards ;
	subjectRD.l2Cards             += chapter.l2Cards ;
	subjectRD.l3Cards             += chapter.l3Cards ;
	subjectRD.masteredCards       += chapter.masteredCards ;
	subjectRD.numSSRMaturedCards  += chapter.numSSRMaturedCards ;
	
	syllabusRD.totalCards         += chapter.totalCards ;
	syllabusRD.notStartedCards    += chapter.notStartedCards ;
	syllabusRD.l0Cards            += chapter.l0Cards ;
	syllabusRD.l1Cards            += chapter.l1Cards ;
	syllabusRD.l2Cards            += chapter.l2Cards ;
	syllabusRD.l3Cards            += chapter.l3Cards ;
	syllabusRD.masteredCards      += chapter.masteredCards ;
	syllabusRD.numSSRMaturedCards += chapter.numSSRMaturedCards ;
}

function drawProgressBar( canvasId, total, vN, v0, v1, v2, v3, v4 ) {

    var c = document.getElementById( canvasId ) ;
    var ctx = c.getContext( "2d" ) ;

    var widths = [] ;

    widths[0] = Math.round( ( vN/total )*c.width ) ;
    widths[1] = Math.round( ( v0/total )*c.width ) ;
    widths[2] = Math.round( ( v1/total )*c.width ) ;
    widths[3] = Math.round( ( v2/total )*c.width ) ;
    widths[4] = Math.round( ( v3/total )*c.width ) ;
    widths[5] = Math.round( ( v4/total )*c.width ) ;

    var colors = [ "#D0D0D0", "#FF0000", "#FF7F2A", 
                   "#FFFF7F", "#AAFFAA", "#00FF00" ] ;

    var curX = 0 ;
    for( var i=0; i<6; i++ )  {
        ctx.fillStyle = colors[i] ;
        ctx.fillRect( curX, 0, widths[i], c.height ) ;
        curX += widths[i] ;
    }
}

// -----------------------------------------------------------------------------
} ) ;