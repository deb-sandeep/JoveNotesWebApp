dashboardApp.controller( 'ExercisesDashboardController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------

RowData.prototype.ROW_TYPE_SYLLABUS = 0 ;
RowData.prototype.ROW_TYPE_SUBJECT  = 1 ;
RowData.prototype.ROW_TYPE_CHAPTER  = 2 ;

function RowData( rowType, name, rowId, parentRowId ) {

	this.rowType     = rowType ;
	this.name        = name ;
	this.rowId       = String( rowId ).replace( / +/g, "-" ) ;
	this.parentRowId = parentRowId ;
	this.isHidden    = true ;

    this.isDeleteAuthorized = false ;

	this.totalCards  = 0 ;

	this.chapter    = null ;
	this.chapterId  = null ;
	this.subjectRD  = null ;
	this.syllabusRD = null ;

	this.isChapterRow = function() {
		return this.rowType == this.ROW_TYPE_CHAPTER ;
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

		this.chapter    = chapter ;
		this.chapterId  = chapter.chapterId ;

		this.subjectRD  = subjectRD ;
		this.syllabusRD = syllabusRD ;

		this.totalCards = chapter.totalCards ;
		this.isHidden   = chapter.isHidden ;

		this.isDeleteAuthorized = chapter.isDeleteAuthorized ;
	}
}

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Exercises" ;
$scope.$parent.currentReport = 'Exercises' ;
$scope.showHiddenExercises   = false ;
$scope.displayRows           = null ;

// ---------------- Main logic for the controller ------------------------------
refreshData() ;

// ---------------- Controller methods -----------------------------------------
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
			if( !$scope.showHiddenExercises ) {
				return false ;
			}
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

$scope.toggleHiddenExercises = function() {
	$scope.showHiddenExercises = !$scope.showHiddenExercises ;
	$http.put( "/__fw__/api/UserPreference", {
		'jove_notes.showHiddenExercises' : $scope.showHiddenExercises ? 'true' : 'false'
	} )
	.success( function( data ){
		log.debug( "Updated user preference." ) ;
	} )
	.error( function( data ){
		log.error( "Could not set hidden chapter preferences for user." ) ;
	});  
    recomputeStatistics() ;
}

$scope.deleteChapter = function( chapterId ) {

	bootbox.confirm( "<h3>Are you sure you want to delete this test paper?</h3>" + 
		             "All related questions and student histories will be deleted.<br>" + 
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
      'saveStateName' : "treeState-tp-" + currentUserName 
    });	
    recomputeStatistics() ;
   	$scope.$digest() ;
} ) ;


// ---------------- Private functions ------------------------------------------
function removeChapter( chapterId ) {

	var chapterRowIndex = -1 ;
	for( var i=0; i<$scope.displayRows.length; i++ ) {
		var rowData = $scope.displayRows[i] ;
		if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER &&
			rowData.chapterId == chapterId ) {

			chapterRowIndex = i ;
			break ;
		}
	}

	if( chapterRowIndex != -1 ) {
		$scope.displayRows.splice( chapterRowIndex, 1 ) ;
		recomputeStatistics() ;
	}
}


function digestPreferences( preferences ) {
	$scope.showHiddenExercises = preferences[ "jove_notes.showHiddenExercises" ] ;
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

		for( subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

			rowNum++ ;
			var subject = syllabus.subjects[ subIndex ] ;
			var subjectRD = new RowData( RowData.prototype.ROW_TYPE_SUBJECT, 
				                         subject.subjectName, 
				                         syllabus.syllabusName + "-" + subject.subjectName, 
				                         syllabusRD.rowId ) ;

			displayData.push( subjectRD ) ;

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

				displayData.push( chapterRD ) ;
			}
		}
	}
	return displayData ;
}

function recomputeStatistics() {

	clearRowDataAttributes() ;
	computeAggregateTestPapersList() ;
}

function clearRowDataAttributes() {

	for( var i=0; i<$scope.displayRows.length; i++ ) {
		var rowData = $scope.displayRows[i] ;
		if( rowData.rowType != RowData.prototype.ROW_TYPE_CHAPTER ) {

			rowData.totalCards = 0 ;
			rowData.chapterId  = null ;
		}
	}
}

function computeAggregateTestPapersList() {

	var curSyllabusRD = null ;
	var curSubjectRD  = null ;

	for( var i=0; i<$scope.displayRows.length; i++ ) {
		var rowData = $scope.displayRows[i] ;
		if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
			if( $scope.isTreeRowVisible( rowData ) ) {
				var chapter = rowData.chapter ;
				updateQuestionCounts( chapter, rowData.subjectRD, rowData.syllabusRD ) ;
			}
		}
	}
}

function updateQuestionCounts( chapter, subjectRD, syllabusRD ) {
	subjectRD.totalCards  += chapter.totalCards ;
	syllabusRD.totalCards += chapter.totalCards ;
}

// ---------------- Server calls -----------------------------------------------
function refreshData() {
	$http.get( "/jove_notes/api/TestPapers/Snapshot" )
         .success( function( data ){
         	digestPreferences( data.preferences ) ;
         	$scope.displayRows = prepareDataForDisplay( data.dashboardContent ) ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

// ---------------- End of controller ------------------------------------------
} ) ;