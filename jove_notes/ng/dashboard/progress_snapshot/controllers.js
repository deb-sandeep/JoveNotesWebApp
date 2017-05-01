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
    this.preparednessScore  = 0 ;
    this.retentionScore     = 0 ;

    this.chapter    = null ;
    this.chapterId  = null ;
    this.subjectRD  = null ;
    this.syllabusRD = null ;

    this.isRowSelected       = false ;
    this.isPartiallySelected = false ;

    this.isRowInSyllabus          = false ;
    this.isRowPartiallyInSyllabus = false ;

    this.hasCardsAvailable = function() {
        return (this.totalCards - this.masteredCards) > 0 ;
    }

    this.isChapterRow = function() {
        return this.rowType == this.ROW_TYPE_CHAPTER ;
    }

    this.addChild = function( childRow ) {
        this.children.push( childRow ) ;
    }

    this.selectionChanged = function() {

        var affectedChapterIds = 
                  this.getAffectedChaptersDueToSelectionChangeCascade( "SEL" ) ;
        
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

    this.inSyllabusSelectionChanged = function() {

        var affectedChapterIds = 
             this.getAffectedChaptersDueToSelectionChangeCascade( "SYLLABUS" ) ;
        
        if( affectedChapterIds.length > 0 ) {
            $http.post( "/jove_notes/api/ProgressSnapshot", {
                'action'         : 'update_in_syllabus',
                'chapterIds'     : affectedChapterIds.join(),
                'selectionState' : this.isRowInSyllabus
            } )
            .error( function( data ){
                $scope.addErrorAlert( "API call failed. " + data ) ;
            });
            recomputeStatistics() ;
        }
    }

    this.getAffectedChaptersDueToSelectionChangeCascade = function( selType ) {

        var affectedChapterIds = [] ;

        if( !this.isChapterRow() ) {
            for( var i=0; i<this.children.length; i++ ) {
                var child = this.children[i] ;

                if( selType == "SEL" ) {
                    child.isRowSelected = this.isRowSelected ;
                }
                else if( selType == "SYLLABUS" ) {
                    child.isRowInSyllabus = this.isRowInSyllabus ;
                }

                var ids = child.getAffectedChaptersDueToSelectionChangeCascade( selType ) ;
                affectedChapterIds = affectedChapterIds.concat( ids ) ;
            }
        }
        else {
            if( selType == "SYLLABUS" ) {
                affectedChapterIds.push( this.chapterId ) ;
            }
            else {
                if( ( this.isHidden && $scope.showHiddenChapters ) ||
                    ( !this.isHidden ) ) {
                    affectedChapterIds.push( this.chapterId ) ;
                }
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
        this.preparednessScore   = chapter.preparednessScore ;
        this.retentionScore      = chapter.retentionScore ;

        this.isNotesAuthorized      = chapter.isNotesAuthorized ;
        this.isFlashcardAuthorized  = chapter.isFlashcardAuthorized ;
        this.isStatisticsAuthorized = chapter.isStatisticsAuthorized ;
        this.isDeleteAuthorized     = chapter.isDeleteAuthorized ;
        this.isHidden               = chapter.isHidden ;
        this.isRowSelected          = !chapter.isDeselected ;
        this.isRowInSyllabus        = chapter.isInSyllabus ;
    }

    this.getTreeRowClass = function() {

        var classStr = "treegrid-" + this.rowId ;
        if( this.parentRowId != -1 ) {
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

        if( this.isRowInSyllabus ) {
            classStr += " selected-insyllabus-row" ;
        }

        return classStr ;
    }

    this.isTreeRowVisible = function() {

        if( this.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( this.isHidden ) {
                if( this.isRowInSyllabus ) {
                    return true ;
                }
                if( !$scope.showHiddenChapters ) {
                    return false ;
                }
            }
            return true ;
        }
        else if( ( this.rowType == RowData.prototype.ROW_TYPE_SUBJECT ) ||
                 ( this.rowType == RowData.prototype.ROW_TYPE_SYLLABUS ) ) {

            for( var i=0; i < this.children.length; i++ ) {
                if( this.children[i].isTreeRowVisible() ) {
                    return true ;
                }
            }
            return false ;
        }
    }

    this.computeSelectionState = function() {
        if( ( this.rowType == RowData.prototype.ROW_TYPE_SUBJECT ) ||
            ( this.rowType == RowData.prototype.ROW_TYPE_SYLLABUS ) ) {

            this.isRowSelected       = false ;
            this.isPartiallySelected = false ;

            this.isRowInSyllabus          = false ;
            this.isRowPartiallyInSyllabus = false ;

            var numChildrenSelected          = 0 ;
            var numChildrenPartiallySelected = 0 ;

            var numChildrenInSyllabus          = 0 ;
            var numChildrenPartiallyInSyllabus = 0 ;

            for( var i=0; i < this.children.length; i++ ) {
                var child = this.children[i] ;
                if( child.isTreeRowVisible() ) {
                    if( child.isPartiallySelected ) {
                        numChildrenPartiallySelected++ ;
                    }
                    else if( child.isRowSelected ) {
                        numChildrenSelected++ ;
                    }

                    if( child.isRowPartiallyInSyllabus ) {
                        numChildrenPartiallyInSyllabus++ ;
                    }
                    else if( child.isRowInSyllabus ) {
                        numChildrenInSyllabus++ ;
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

            if( numChildrenInSyllabus > 0 || numChildrenPartiallyInSyllabus > 0 ) {
                this.isRowInSyllabus = true ;
                if( ( numChildrenInSyllabus < this.children.length ) || 
                    ( numChildrenPartiallyInSyllabus > 0 ) ) {
                    this.isRowPartiallyInSyllabus = true ;
                }
            }
        }
    }
}

$scope.$parent.pageTitle         = "Progress Dashboard" ;
$scope.$parent.currentReport     = 'ProgressSnapshot' ;
$scope.showHiddenChapters        = false ;
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
    $scope.showHiddenChapters = !$scope.showHiddenChapters ;
    $http.put( "/__fw__/api/UserPreference", {
        'jove_notes.showHiddenChapters' : $scope.showHiddenChapters ? 'true' : 'false'
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

$scope.resetLevelOfAllCards = function( level ) {

    var selectedChapters = getSelectedChapterIds() ;
    if( selectedChapters.length == 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        log.debug( "Applying level " + level + " to all cards for " +
                   "chapters " + selectedChapters.join() ) ;

        $http.post( '/jove_notes/api/ResetLevel', { 
            chapterIds : selectedChapters,
            level      : level
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

$scope.launchChainedFlashcards = function( type ) {

    var chapters = null ;

    if( type == 'randomize' || 
        type == 'ordered'   || 
        type == 'retention' ) {
        chapters = getSelectedChapterRows() ;
    }
    else if( type == 'syllabus' ) {
        chapters = getInSyllabusChapterRows() ;
    }

    if( chapters == null || chapters.length == 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected or the " + 
                     "selected chapters don't have available cards." ) ;
        return ;
    }


    if( type == 'randomize' ) {
        chapters.shuffle() ;
    }
    else if( type == 'retention' ) {
        chapters.sort( function( c1, c2 ){
            return c1.retentionScore - c2.retentionScore ;
        }) ;
    }
    else if( type == 'syllabus' ) {
        chapters.sort( function( c1, c2 ){
            return c1.preparednessScore - c2.preparednessScore ;
        }) ;
    }

    var selectedChapters = [] ;
    for( var i=0; i<chapters.length; i++ ) {
        if( chapters[i].hasCardsAvailable() ) {
            selectedChapters.push( chapters[i].chapterId ) ;
        }
    }

    var url = "/apps/jove_notes/ng/flashcard/index.php" ;
    url += "?chapterId=" + selectedChapters.join() ;

    window.location.href = url ;
}

$scope.toggleVisibilityInBulk = function() {

    var selectedChapterRows = getSelectedChapterRows() ;
    var visibilityData = [] ;

    if( selectedChapterRows.length == 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        for( var i=0; i<selectedChapterRows.length; i++ ) {
            var row = selectedChapterRows[i] ;
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
            if( $scope.showHiddenChapters ) {
                $scope.alreadyFetchedAllChapters = true ;
            }
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function digestPreferences( preferences ) {
    $scope.showHiddenChapters   = preferences[ "jove_notes.showHiddenChapters" ] ;
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
        else if( rowData.rowType == RowData.prototype.ROW_TYPE_SUBJECT ) {
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
        else if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() ) {

                var chapter = rowData.chapter ;

                updateCardCounts( chapter, rowData.subjectRD, rowData.syllabusRD ) ;

                if( chapter.isFlashcardAuthorized && chapter.numSSRMaturedCards > 0 ) {
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

    for( var i=0; i<$scope.progressSnapshot.length; i++ ) {
        var rowData = $scope.progressSnapshot[i] ;
        if( rowData.isTreeRowVisible() ) {
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

function getSelectedChapterIds() {

    var chapterIds = [] ;
    for( var i=0; i<$scope.progressSnapshot.length; i++ ) {

        var rowData = $scope.progressSnapshot[i] ;
        if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {

            if( rowData.isTreeRowVisible() && rowData.isRowSelected ) {
                chapterIds.push( rowData.chapterId ) ;
            }
        }
    }
    return chapterIds ;
}

function getSelectedChapterRows() {

    var selectedRows = [] ;
    for( var i=0; i<$scope.progressSnapshot.length; i++ ) {

        var rowData = $scope.progressSnapshot[i] ;
        if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() && 
                rowData.isRowSelected ) {
                selectedRows.push( rowData ) ;
            }
        }
    }
    return selectedRows ;
}

function getInSyllabusChapterRows() {

    var inSyllabusRows = [] ;
    for( var i=0; i<$scope.progressSnapshot.length; i++ ) {

        var rowData = $scope.progressSnapshot[i] ;
        if( rowData.rowType == RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isRowInSyllabus && 
                rowData.hasCardsAvailable() ) {

                inSyllabusRows.push( rowData ) ;
            }
        }
    }
    return inSyllabusRows ;
}

// -----------------------------------------------------------------------------
} ) ;