dashboardApp.controller( 'ExercisesDashboardController', function( $scope, $http ) {
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
    this.resurrectedCards   = 0 ;
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

    this.isRowSelected       = true ;
    this.isPartiallySelected = false ;

    this.isChapterRow = function() {
        return this.rowType === this.ROW_TYPE_CHAPTER ;
    }

    this.isSubjectRow = function() {
        return this.rowType === this.ROW_TYPE_SUBJECT ;
    }

    this.isSyllabusRow = function() {
        return this.rowType === this.ROW_TYPE_SYLLABUS ;
    }

    this.addChild = function( childRow ) {
        this.children.push( childRow ) ;
    }

    this.selectionChanged = function() {
        let affectedChapterIds = [];

        if( !this.isChapterRow() ) {
            for( let i=0; i<this.children.length; i++ ) {
                this.children[i].isRowSelected = this.isRowSelected ;
                const affectedIds = this.children[i].handleSelectionChangeCascade();

                affectedChapterIds = affectedChapterIds.concat( affectedIds ) ;
            }
        }
        else {
            affectedChapterIds.push( this.chapterId ) ;
        }

        if( affectedChapterIds.length > 0 ) {
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
    }

    this.handleSelectionChangeCascade = function() {

        let affectedChapterIds = [];

        if( !this.isChapterRow() ) {
            for( let i=0; i<this.children.length; i++ ) {
                const child = this.children[i];
                child.isRowSelected = this.isRowSelected ;
                const affectedIds = child.handleSelectionChangeCascade();

                affectedChapterIds = affectedChapterIds.concat( affectedIds ) ;
            }
        }
        else {
            if( ( this.isHidden && $scope.showHiddenExercises ) ||
                ( !this.isHidden ) ) {
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
        this.resurrectedCards    = chapter.nrCards ;
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

    this.getTreeRowClass = function() {

        let classStr = `treegrid-${this.rowId}`;
        if( this.parentRowId !== -1 ) {
            classStr += " treegrid-parent-" + this.parentRowId ;
        }

        switch( this.rowType ) {
            case RowData.prototype.ROW_TYPE_SYLLABUS:
                classStr += " info" ;
                break ;
            case RowData.prototype.ROW_TYPE_SUBJECT:
                classStr += " active" ;
                break ;
        }

        if( this.isRowSelected ) {
            classStr += " selected-dashboard-row" ;
        }

        return classStr ;
    }

    this.isTreeRowVisible = function() {

        if( this.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( this.isHidden ) {
                if( !$scope.showHiddenExercises ) {
                    return false ;
                }
            }
            return true ;
        }
        else if( ( this.rowType === RowData.prototype.ROW_TYPE_SUBJECT ) ||
                 ( this.rowType === RowData.prototype.ROW_TYPE_SYLLABUS ) ) {

            for( let i=0; i < this.children.length; i++ ) {
                if( this.children[i].isTreeRowVisible() ) {
                    return true ;
                }
            }
            return false ;
        }
    }

    this.computeSelectionState = function() {
        if( ( this.rowType === RowData.prototype.ROW_TYPE_SUBJECT ) ||
            ( this.rowType === RowData.prototype.ROW_TYPE_SYLLABUS ) ) {

            this.isRowSelected       = false ;
            this.isPartiallySelected = false ;

            let numChildrenSelected = 0;
            let numChildrenPartiallySelected = 0;

            for( let i=0; i < this.children.length; i++ ) {
                const child = this.children[i];
                if( child.isTreeRowVisible() ) {
                    if( child.isPartiallySelected ) {
                        numChildrenPartiallySelected++ ;
                    }
                    else if( child.isRowSelected ) {
                        numChildrenSelected++ ;
                    }
                }
            }

            if( numChildrenSelected > 0 || numChildrenPartiallySelected > 0 ) {
                this.isRowSelected = true ;

                if( ( numChildrenSelected < this.children.length ) || 
                    ( numChildrenPartiallySelected > 0 ) ) {
                    this.isPartiallySelected = true ;
                }
            }
        }
    }
}

$scope.$parent.pageTitle         = "Practice Exercises" ;
$scope.$parent.currentReport     = 'Exercises' ;
$scope.showHiddenExercises       = false ;
$scope.progressSnapshot          = null ;
$scope.alreadyFetchedAllChapters = false ;

refreshData() ;

$scope.refreshData = function() {
    refreshData() ;
}

$scope.expandAll = function() {
    if( $scope.progressSnapshot.length > 0 ) {
        $('.tree').treegrid('expandAll') ;
    }
}

$scope.collapseAll = function() {
    if( $scope.progressSnapshot.length > 0 ) {
        $('.tree').treegrid('collapseAll') ;
    }
}

$scope.toggleHiddenChapters = function() {
    $scope.showHiddenExercises = !$scope.showHiddenExercises ;
    $http.put( "/__fw__/api/UserPreference", {
        'jove_notes.showHiddenExercises' : $scope.showHiddenExercises ? 'true' : 'false'
    } )
    .success( function( data ){
        if( !$scope.alreadyFetchedAllChapters ) {
            refreshData() ;
        }
        else {
            recomputeStatistics() ;
        }
    } )
    .error( function( data ){
        log.error( "Could not set hidden chapter preferences for user." ) ;
    });  
}

$scope.deleteChapter = function( chapterId ) {

    bootbox.confirm( "<h3>Are you sure you want to delete this chapter?</h3>" + 
                     "All notes, cards and student histories will be deleted.<br>" + 
                     "Please confirm.", 
        function( okSelected ) {
            if( okSelected ) {
                $http.delete( "/jove_notes/api/Chapter/" + chapterId )
                     .success( function( data ){
                        if( data != null && data.trim() === "Success" ) {
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

$scope.launchExerciseWithSelectedChapters = function() {

    const selectedChapters = [];
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {
        const rowData = $scope.progressSnapshot[i];
        if( rowData.isChapterRow() && rowData.isRowSelected ) {
            selectedChapters.push( rowData.chapterId ) ;
        }
    }

    if( selectedChapters.length > 0 ) {
        let url = "/apps/jove_notes/ng/exercise/index.php";
        url += "?chapterId=" + selectedChapters.join() ;

        window.location.href = url ;        
    }
}

$scope.reactivateProblems = function( chapterId ) {

    const selectedChapters = [];
    selectedChapters.push( chapterId ) ;
    callReactivateProblemsServerAPI( selectedChapters ) ;
}

$scope.reactivateProblemsForSelectedChapters = function() {

    const selectedChapters = getSelectedChapterIds() ;
    callReactivateProblemsServerAPI( selectedChapters ) ;
}

$scope.toggleVisibilityInBulk = function() {

    const selectedChapterRows = getSelectedChapterRows() ;
    const visibilityData = [] ;

    if( selectedChapterRows.length === 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        for( let i=0; i<selectedChapterRows.length; i++ ) {
            const row = selectedChapterRows[i];
            row.isHidden = !row.isHidden ;
            visibilityData.push( row.chapterId ) ;
            visibilityData.push( row.isHidden ? 1 : 0 ) ;
        }
        $http.post( "/jove_notes/api/ProgressSnapshot", {
            'action'         : 'update_visibility_batch',
            'visibilityData' : visibilityData
        } )
        .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
        });
        recomputeStatistics() ;
    }
}

$scope.$on( 'onRenderComplete', function( scope ){
    $('.tree').treegrid({
      'initialState': 'collapsed',
      'saveState': true,
      'saveStateName' : "treeState-ex-" + currentUserName 
    }); 
    recomputeStatistics() ;
    $scope.$digest() ;
} ) ;

function removeChapter( chapterId ) {

    let chapterRowIndex = -1;
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {
        const rowData = $scope.progressSnapshot[i];
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER &&
            rowData.chapterId === chapterId ) {

            chapterRowIndex = i ;
            break ;
        }
    }

    if( chapterRowIndex !== -1 ) {
        $scope.progressSnapshot.splice( chapterRowIndex, 1 ) ;
        recomputeStatistics() ;
    }
}

function refreshData() {

    $http.get( "/jove_notes/api/ProgressSnapshot?chapterType=exercises" )
     .success( function( data ){
         console.log( data ) ;
         digestPreferences( data.preferences ) ;
         $scope.progressSnapshot = prepareDataForDisplay( data.dashboardContent ) ;
         if( $scope.showHiddenExercises ) {
             $scope.alreadyFetchedAllChapters = true ;
         }
     })
     .error( function( data ){
         $scope.addErrorAlert( "API call failed. " + data ) ;
     });
}

function digestPreferences( preferences ) {
    $scope.showHiddenExercises = preferences[ "jove_notes.showHiddenExercises" ] ;
}

function prepareDataForDisplay( rawData ) {

    const displayData = [];
    let rowNum = 0;

    for( sylIndex=0; sylIndex<rawData.length; sylIndex++ ) {

        rowNum++ ;
        const syllabus = rawData[sylIndex];
        const syllabusRD = new RowData( RowData.prototype.ROW_TYPE_SYLLABUS,
                                        syllabus.syllabusName,
                                        syllabus.syllabusName, -1 );

        displayData.push( syllabusRD ) ;

        let numSubjectsSelected = 0;

        for( subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

            rowNum++ ;
            const subject = syllabus.subjects[subIndex];
            const subjectRD = new RowData( RowData.prototype.ROW_TYPE_SUBJECT,
                                            subject.subjectName,
                                            syllabus.syllabusName + "-" + subject.subjectName,
                                            syllabusRD.rowId );

            syllabusRD.addChild( subjectRD ) ;
            displayData.push( subjectRD ) ;

            let numChaptersSelected = 0;
            for( chpIndex=0; chpIndex<subject.chapters.length; chpIndex++ ) {

                rowNum++ ;
                const chapter = subject.chapters[chpIndex] ;
                const displayName = chapter.chapterNum + "." + chapter.subChapterNum +
                                    " - " + chapter.chapterName ;
                const chapterRD = new RowData( RowData.prototype.ROW_TYPE_CHAPTER,
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

    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {
        const rowData = $scope.progressSnapshot[i] ;
        if( rowData.rowType !== RowData.prototype.ROW_TYPE_CHAPTER ) {

            rowData.totalCards         = 0 ;
            rowData.notStartedCards    = 0 ;
            rowData.resurrectedCards   = 0 ;
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

    let curSyllabusRD = null;
    let curSubjectRD = null;

    let chaptersForSyllabus = null;
    let chaptersForSubject = null;

    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {
        const rowData = $scope.progressSnapshot[i];

        if( rowData.rowType === RowData.prototype.ROW_TYPE_SYLLABUS ) {
            if( curSubjectRD != null ) {
                curSubjectRD.computeSelectionState() ;
            }

            if( curSyllabusRD != null ) {
                if( chaptersForSyllabus.length > 0 ) {
                    chaptersForSyllabus.shuffle() ;
                    curSyllabusRD.chapterId = chaptersForSyllabus.join() ;
                    curSyllabusRD.isFlashcardAuthorized = true ;
                }

                curSyllabusRD.computeSelectionState() ;
            }
            curSyllabusRD = rowData ;
            chaptersForSyllabus = [] ;
        }
        else if( rowData.rowType === RowData.prototype.ROW_TYPE_SUBJECT ) {
            if( curSubjectRD != null ) {
                if( chaptersForSubject.length > 0 ) {
                    chaptersForSubject.shuffle() ;
                    curSubjectRD.chapterId = chaptersForSubject.join() ;
                    curSubjectRD.isFlashcardAuthorized = true ;
                }

                curSubjectRD.computeSelectionState() ;
            }
            curSubjectRD = rowData ;
            chaptersForSubject = [] ;
        }
        else if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() ) {

                const chapter = rowData.chapter;

                updateCardCounts( chapter, rowData.subjectRD, rowData.syllabusRD ) ;

                if( chapter.isFlashcardAuthorized ) {
                    chaptersForSubject.push( chapter.chapterId ) ;
                    chaptersForSyllabus.push( chapter.chapterId ) ;
                }
            }
        }
    }

    curSubjectRD.computeSelectionState() ;
    curSyllabusRD.computeSelectionState() ;

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

    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {
        const rowData = $scope.progressSnapshot[i];
        if( rowData.isTreeRowVisible() ) {
            drawProgressBar( "canvas-" + rowData.rowId, 
                             rowData.totalCards,
                             rowData.notStartedCards,
                             rowData.resurrectedCards,
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
    subjectRD.resurrectedCards    += chapter.nrCards ;
    subjectRD.l0Cards             += chapter.l0Cards ;
    subjectRD.l1Cards             += chapter.l1Cards ;
    subjectRD.l2Cards             += chapter.l2Cards ;
    subjectRD.l3Cards             += chapter.l3Cards ;
    subjectRD.masteredCards       += chapter.masteredCards ;
    subjectRD.numSSRMaturedCards  += chapter.numSSRMaturedCards ;
    
    syllabusRD.totalCards         += chapter.totalCards ;
    syllabusRD.notStartedCards    += chapter.notStartedCards ;
    syllabusRD.resurrectedCards   += chapter.nrCards ;
    syllabusRD.l0Cards            += chapter.l0Cards ;
    syllabusRD.l1Cards            += chapter.l1Cards ;
    syllabusRD.l2Cards            += chapter.l2Cards ;
    syllabusRD.l3Cards            += chapter.l3Cards ;
    syllabusRD.masteredCards      += chapter.masteredCards ;
    syllabusRD.numSSRMaturedCards += chapter.numSSRMaturedCards ;
}

function drawProgressBar( canvasId, total, vN, vR, v0, v1, v2, v3, v4 ) {

    const c = document.getElementById( canvasId );
    const ctx = c.getContext( "2d" );

    const widths = [];

    widths[0] = Math.round( ( vN/total )*c.width ) ;
    widths[1] = Math.round( ( vR/total )*c.width ) ;
    widths[2] = Math.round( ( v0/total )*c.width ) ;
    widths[3] = Math.round( ( v1/total )*c.width ) ;
    widths[4] = Math.round( ( v2/total )*c.width ) ;
    widths[5] = Math.round( ( v3/total )*c.width ) ;
    widths[6] = Math.round( ( v4/total )*c.width ) ;

    const colors = [
        "#FF0000", //NS
        "#D0D0D0", //NR
        "#F78383", //L0
        "#FAC4A0", //L1
        "#FFFF7F", //L2
        "#AAFFAA", //L3
        "#00FF00"  //MAS
    ];

    let curX = 0;
    for( let i=0; i<7; i++ )  {
        ctx.fillStyle = colors[i] ;
        ctx.fillRect( curX, 0, widths[i], c.height ) ;
        curX += widths[i] ;
    }
}

function getSelectedChapterIds() {

    const chapterIds = [];
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {

        const rowData = $scope.progressSnapshot[i];
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {

            if( rowData.isTreeRowVisible() && rowData.isRowSelected ) {
                chapterIds.push( rowData.chapterId ) ;
            }
        }
    }
    return chapterIds ;
}

function getSelectedChapterRows() {

    const selectedRows = [];
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {

        const rowData = $scope.progressSnapshot[i];
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() && rowData.isRowSelected ) {
                selectedRows.push( rowData ) ;
            }
        }
    }
    return selectedRows ;
}

function callReactivateProblemsServerAPI( selectedChapters ) {

    if( selectedChapters.length === 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        log.debug( "Reactivating mastered cards for " +
                   "chapters " + selectedChapters.join() ) ;

        $http.post( '/jove_notes/api/ResetLevel', { 
            chapterIds : selectedChapters,
            entityType : 'Exercise'
        })
        .success( function( data ){
            log.debug( "Level successfully applied to all cards" ) ;
            refreshData() ;
        })
        .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
        }) ;
    }
}

// -----------------------------------------------------------------------------
} ) ;