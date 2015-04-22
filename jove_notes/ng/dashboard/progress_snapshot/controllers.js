dashboardApp.controller( 'ProgressSnapshotController', function( $scope ) {
// -----------------------------------------------------------------------------

RowData.prototype.ROW_TYPE_SYLLABUS = 0 ;
RowData.prototype.ROW_TYPE_SUBJECT  = 1 ;
RowData.prototype.ROW_TYPE_CHAPTER  = 2 ;

function RowData( rowType, name, rowNum, parentRowNum ) {

	this.rowType      = rowType ;
	this.name         = name ;
	this.rowNum       = rowNum ;
	this.parentRowNum = parentRowNum ;

	this.totalCards      = 0 ;
	this.notStartedCards = 0 ;
	this.l0Cards         = 0 ;
	this.l1Cards         = 0 ;
	this.l2Cards         = 0 ;
	this.l3Cards         = 0 ;
	this.masteredCards   = 0 ;
}

$scope.progressSnapshot = prepareDataForDisplay( getData() ) ;

$scope.getTreeRowClass = function( rowData ) {
	var classStr = "treegrid-" + rowData.rowNum ;
	if( rowData.parentRowNum != -1 ) {
		classStr += " treegrid-parent-" + rowData.parentRowNum ;
	}

	switch( rowData.rowType ) {
		case RowData.prototype.ROW_TYPE_SYLLABUS:
			classStr += " success" ;
			break ;
		case RowData.prototype.ROW_TYPE_SUBJECT:
			classStr += " active" ;
			break ;
	}
	return classStr ;
}

$scope.$on( 'onRenderComplete', function( scope ){
	$('.tree').treegrid() ;
} ) ;

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
				var chapterRD = new RowData( RowData.prototype.ROW_TYPE_CHAPTER, 
					                         chapter.chapterName, rowNum, 
					                         subjectRD.rowNum ) ;
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
}

function getData() {
	return [ 
		{
			"syllabusName" : "Class-8",
			"subjects" : [ 
				{
					"subjectName" : "Physics",
					"chapters" : [
						{
							"chapterName"     : "Heat",
							"totalCards"      : 100 ,
							"notStartedCards" : 10 ,
							"l0Cards"         : 10 ,
							"l1Cards"         : 20 ,
							"l2Cards"         : 20 ,
							"l3Cards"         : 20 ,
							"masteredCards"   : 20 ,
						},
						{
							"chapterName" : "Motion",
							"totalCards"      : 100 ,
							"notStartedCards" : 20 ,
							"l0Cards"         : 5 ,
							"l1Cards"         : 15 ,
							"l2Cards"         : 15 ,
							"l3Cards"         : 25 ,
							"masteredCards"   : 20 ,
						}
					]
				},
				{
					"subjectName" : "Chemistry",
					"chapters"    : []
				}
			]
		},
		{
			"syllabusName" : "Class-9",
			"subjects"     : []
		} 
	] ;
}

// -----------------------------------------------------------------------------
} ) ;