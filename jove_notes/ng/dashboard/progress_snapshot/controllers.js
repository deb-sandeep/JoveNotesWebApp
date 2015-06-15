dashboardApp.controller( 'ProgressSnapshotController', function( $scope, $http ) {
// -----------------------------------------------------------------------------

RowData.prototype.ROW_TYPE_SYLLABUS = 0 ;
RowData.prototype.ROW_TYPE_SUBJECT  = 1 ;
RowData.prototype.ROW_TYPE_CHAPTER  = 2 ;

function RowData( rowType, name, rowNum, parentRowNum ) {

	this.rowType      = rowType ;
	this.name         = name ;
	this.rowNum       = rowNum ;
	this.parentRowNum = parentRowNum ;

    this.isNotesAuthorized      = false ;
    this.isFlashcardAuthorized  = false ;
    this.isStatisticsAuthorized = false ;

	this.totalCards         = 0 ;
	this.notStartedCards    = 0 ;
	this.l0Cards            = 0 ;
	this.l1Cards            = 0 ;
	this.l2Cards            = 0 ;
	this.l3Cards            = 0 ;
	this.masteredCards      = 0 ;
	this.numSSRMaturedCards = 0 ;

	this.chapterId = 0 ;

	this.isChapterRow = function() {
		return this.rowType == this.ROW_TYPE_CHAPTER ;
	}
}

$scope.$parent.pageTitle = "Progress Dashboard" ;
$scope.$parent.currentReport = 'ProgressSnapshot' ;

$scope.progressSnapshot = null ;

refreshData() ;

$scope.refreshData = function() {
	refreshData() ;
}

function refreshData() {
	$http.get( "/jove_notes/api/ProgressSnapshot" )
         .success( function( data ){
         	$scope.progressSnapshot = prepareDataForDisplay( data ) ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

$scope.getTreeRowClass = function( rowData ) {
	var classStr = "treegrid-" + rowData.rowNum ;
	if( rowData.parentRowNum != -1 ) {
		classStr += " treegrid-parent-" + rowData.parentRowNum ;
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

$scope.$on( 'onRenderComplete', function( scope ){
    $('.tree').treegrid({
      'initialState': 'collapsed',
      'saveState': true,
    });	
} ) ;

$scope.expandAll = function() {
	$('.tree').treegrid('expandAll') ;
}

$scope.collapseAll = function() {
	$('.tree').treegrid('collapseAll') ;
}

$scope.$on( 'onRowRender', function( scope, rowId ){
	var rowData = $scope.progressSnapshot[ rowId ] ;
	drawProgressBar( "canvas-" + rowData.rowNum, 
	                 rowData.totalCards, 
	                 rowData.notStartedCards,
	                 rowData.l0Cards,
	                 rowData.l1Cards,
	                 rowData.l2Cards,
	                 rowData.l3Cards,
	                 rowData.masteredCards ) ;
} ) ;

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

    var colors = [ "#D0D0D0", "#FF0000", "#FF7F2A", "#FFFF7F", "#AAFFAA", "#00FF00" ] ;

    var curX = 0 ;
    for( var i=0; i<6; i++ )  {
        ctx.fillStyle = colors[i] ;
        ctx.fillRect( curX, 0, widths[i], c.height ) ;
        curX += widths[i] ;
    }
}

function prepareDataForDisplay( rawData ) {

	var displayData = [] ;
	var rowNum = 0 ;

	for( sylIndex=0; sylIndex<rawData.length; sylIndex++ ) {

		rowNum++ ;
		var syllabus = rawData[ sylIndex ] ;
		var syllabusRD = new RowData( RowData.prototype.ROW_TYPE_SYLLABUS, 
			                          syllabus.syllabusName, rowNum, -1 ) ;
		displayData.push( syllabusRD ) ;

		for( subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

			rowNum++ ;
			var subject = syllabus.subjects[ subIndex ] ;
			var subjectRD = new RowData( RowData.prototype.ROW_TYPE_SUBJECT, 
				                         subject.subjectName, rowNum, 
				                         syllabusRD.rowNum ) ;
			displayData.push( subjectRD ) ;

			for( chpIndex=0; chpIndex<subject.chapters.length; chpIndex++ ) {

				rowNum++ ;
				var chapter = subject.chapters[ chpIndex  ] ;
				var displayName = chapter.chapterNum + "." + chapter.subChapterNum + 
				                  " - " + chapter.chapterName ;
				var chapterRD = new RowData( RowData.prototype.ROW_TYPE_CHAPTER, 
					                         displayName, rowNum, 
					                         subjectRD.rowNum ) ;

				chapterRD.isNotesAuthorized      = chapter.isNotesAuthorized ;
				chapterRD.isFlashcardAuthorized  = chapter.isFlashcardAuthorized ;
				chapterRD.isStatisticsAuthorized = chapter.isStatisticsAuthorized ;

				chapterRD.chapterId = chapter.chapterId ;

				displayData.push( chapterRD ) ;

				updateCardCounts( chapter, chapterRD, subjectRD, syllabusRD ) ;
			}
		}
	}
	return displayData ;
}

function updateCardCounts( chapter, chapterRD, subjectRD, syllabusRD ) {

	chapterRD.totalCards       =  chapter.totalCards ;
	subjectRD.totalCards       += chapter.totalCards ;
	syllabusRD.totalCards      += chapter.totalCards ;

	chapterRD.notStartedCards  =  chapter.notStartedCards ;
	subjectRD.notStartedCards  += chapter.notStartedCards ;
	syllabusRD.notStartedCards += chapter.notStartedCards ;

	chapterRD.l0Cards          =  chapter.l0Cards ;
	subjectRD.l0Cards          += chapter.l0Cards ;
	syllabusRD.l0Cards         += chapter.l0Cards ;

	chapterRD.l1Cards          =  chapter.l1Cards ;
	subjectRD.l1Cards          += chapter.l1Cards ;
	syllabusRD.l1Cards         += chapter.l1Cards ;

	chapterRD.l2Cards          =  chapter.l2Cards ;
	subjectRD.l2Cards          += chapter.l2Cards ;
	syllabusRD.l2Cards         += chapter.l2Cards ;

	chapterRD.l3Cards          =  chapter.l3Cards ;
	subjectRD.l3Cards          += chapter.l3Cards ;
	syllabusRD.l3Cards         += chapter.l3Cards ;

	chapterRD.masteredCards    =  chapter.masteredCards ;
	subjectRD.masteredCards    += chapter.masteredCards ;
	syllabusRD.masteredCards   += chapter.masteredCards ;

	chapterRD.numSSRMaturedCards  = chapter.numSSRMaturedCards ;
	subjectRD.numSSRMaturedCards += chapter.numSSRMaturedCards ;
	syllabusRD.numSSRMaturedCards+= chapter.numSSRMaturedCards ;
}

// -----------------------------------------------------------------------------
} ) ;