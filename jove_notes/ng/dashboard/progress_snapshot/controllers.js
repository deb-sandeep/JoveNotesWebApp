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
    this.resurrectedCards   = 0 ;
    this.l0Cards            = 0 ;
    this.l1Cards            = 0 ;
    this.l2Cards            = 0 ;
    this.l3Cards            = 0 ;
    this.masteredCards      = 0 ;
    this.pctNS              = 0 ;
    this.pctNR              = 0 ;
    this.pctL0              = 0 ;
    this.pctL1              = 0 ;
    this.pctL2              = 0 ;
    this.pctL3              = 0 ;
    this.pctMAS             = 0 ;
    this.projectedMarks     = 0 ;

    this.numSSRMaturedCards = 0 ;
    this.numSSRInSyllabusMaturedCards = 0 ;
    this.preparednessScore  = 0 ;
    this.retentionScore     = 0 ;
    this.urgencyScore       = 0 ;
    this.pctSectionsActive  = 0 ;

    this.chapter    = null ;
    this.chapterId  = null ;
    this.subjectRD  = null ;
    this.syllabusRD = null ;

    this.isRowSelected       = false ;
    this.isPartiallySelected = false ;

    this.isRowInSyllabus          = false ;
    this.isRowPartiallyInSyllabus = false ;

    this.isRowInCurrentFocus = false ;

    this.hasCardsAvailable = function() {
        return (this.totalCards - this.masteredCards) > 0 ;
    }

    this.isChapterRow = function() {
        return this.rowType === this.ROW_TYPE_CHAPTER ;
    }

    this.addChild = function( childRow ) {
        this.children.push( childRow ) ;
    }

    this.selectionChanged = function() {

        const affectedChapterIds =
            this.getAffectedChaptersDueToSelectionChangeCascade("SEL");

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

        const affectedChapterIds =
            this.getAffectedChaptersDueToSelectionChangeCascade("SYLLABUS");

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

        let affectedChapterIds = [];

        if( !this.isChapterRow() ) {
            for( let i=0; i<this.children.length; i++ ) {
                const child = this.children[i];

                if( selType === "SEL" ) {
                    child.isRowSelected = this.isRowSelected ;
                }
                else if( selType === "SYLLABUS" ) {
                    child.isRowInSyllabus = this.isRowInSyllabus ;
                }

                const ids = child.getAffectedChaptersDueToSelectionChangeCascade(selType);
                affectedChapterIds = affectedChapterIds.concat( ids ) ;
            }
        }
        else {
            if( selType === "SYLLABUS" ) {
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

    this.toggleCurrentFocus = function() {
        this.isRowInCurrentFocus = !this.isRowInCurrentFocus ;
        $http.post( "/jove_notes/api/ProgressSnapshot", {
            'action'         : 'update_current_focus',
            'chapterId'      : this.chapterId,
            'isCurrentFocus' : this.isRowInCurrentFocus,
        } )
            .error( function( data ){
                $scope.addErrorAlert( "API call failed. " + data ) ;
            });
        recomputeStatistics() ;
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
        this.pctNS               = this.notStartedCards / this.totalCards ;
        this.pctNR               = this.resurrectedCards/ this.totalCards ;
        this.pctL0               = this.l0Cards         / this.totalCards ;
        this.pctL1               = this.l1Cards         / this.totalCards ;
        this.pctL2               = this.l2Cards         / this.totalCards ;
        this.pctL3               = this.l3Cards         / this.totalCards ;
        this.pctMAS              = this.masteredCards   / this.totalCards ;
        this.projectedMarks      = ( this.pctMAS + 
                                     this.pctL3 + 
                                     this.pctL2*0.75 + 
                                     this.pctL1*0.5 + 
                                     this.pctL0*0.25 +
                                     this.pctNR*0.5 )*100 ;

        this.numSSRMaturedCards           = chapter.numSSRMaturedCards ;
        this.numSSRInSyllabusMaturedCards = chapter.isInSyllabus ? this.numSSRMaturedCards : 0 ;

        this.preparednessScore      = chapter.preparednessScore ;
        this.retentionScore         = chapter.retentionScore ;

        this.isNotesAuthorized      = chapter.isNotesAuthorized ;
        this.isFlashcardAuthorized  = chapter.isFlashcardAuthorized ;
        this.isStatisticsAuthorized = chapter.isStatisticsAuthorized ;
        this.isDeleteAuthorized     = chapter.isDeleteAuthorized ;
        this.isHidden               = chapter.isHidden ;
        this.isRowSelected          = !chapter.isDeselected ;
        this.isRowInSyllabus        = chapter.isInSyllabus ;
        this.isRowInCurrentFocus    = chapter.isCurrentFocus ;
        this.pctSectionsActive      = chapter.pctSectionsActive ;

        this.urgencyScore = this.computeUrgencyScore() ;
    }

    this.computeUrgencyScore = function() {
        let score = 0;
        if( this.isChapterRow() && this.hasCardsAvailable() ) {

            score = ( this.pctNS * 12 ) + 
                    ( this.pctNR *  2 ) +
                    ( this.pctL0 *  8 ) + 
                    ( this.pctL1 *  6 ) + 
                    ( this.pctL2 *  4 ) + 
                    ( this.pctL3 *  1 ) ;          
        }
        return score ;
    }    

    this.getTreeRowClass = function() {

        let classStr = "treegrid-" + this.rowId;
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

        if( this.isRowInSyllabus ) {
            classStr += " selected-insyllabus-row" ;
        }

        return classStr ;
    }

    this.isTreeRowVisible = function() {

        if( this.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            // The base visibility of a chapter determined by whether its hidden
            // flag is set.
            //
            // If a row is visible at this point, the showOnlyCurrentFocus preference
            // is checked. If the showOnlyCurrentFocus flag is set and the row is
            // not marked as current focus, it is hidden.
            //
            // Overriding cases
            //   - If the showHiddenChapters preference is or
            //   - If the chapter is in syllabus, it is shown always
            let visible = !this.isHidden ;

            if( visible && $scope.showOnlyCurrentFocus ) {
                visible = this.isRowInCurrentFocus ;
            }

            if( $scope.showHiddenChapters || this.isRowInSyllabus ) {
                visible = true ;
            }

            if( $scope.showOnlyChaptersWithNSCards && this.notStartedCards === 0 ) {
                visible = false ;
            }
            if( $scope.showOnlyChaptersWithNRCards && this.resurrectedCards === 0 ) {
                visible = false ;
            }
            if( $scope.showOnlyChaptersWithL0Cards && this.l0Cards === 0 ) {
                visible = false ;
            }
            return visible ;
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

            this.isRowInSyllabus          = false ;
            this.isRowPartiallyInSyllabus = false ;

            let numChildrenSelected = 0;
            let numChildrenPartiallySelected = 0;

            let numChildrenInSyllabus = 0;
            let numChildrenPartiallyInSyllabus = 0;

            for( let i=0; i < this.children.length; i++ ) {
                const child = this.children[i];
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
$scope.syllabusMerged            = false ;
$scope.showOnlyCurrentFocus      = false ;
$scope.showPercentage            = false ;
$scope.progressSnapshot          = null ;
$scope.alreadyFetchedAllChapters = false ;

$scope.showOnlyChaptersWithNSCards = false ;
$scope.showOnlyChaptersWithNRCards = false ;
$scope.showOnlyChaptersWithL0Cards = false ;

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

$scope.toggleShowPercentage = function() {
    $scope.showPercentage = !$scope.showPercentage ;
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

$scope.toggleMergeSyllabus = function() {

    $scope.syllabusMerged = !$scope.syllabusMerged ;
    $http.put( "/__fw__/api/UserPreference", {
        'jove_notes.syllabusMerged' : $scope.syllabusMerged ? 'true' : 'false'
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

$scope.toggleShowOnlyCurrentFocus = function() {

    $scope.showOnlyCurrentFocus = !$scope.showOnlyCurrentFocus ;
    $http.put( "/__fw__/api/UserPreference", {
        'jove_notes.showOnlyCurrentFocus' : $scope.showOnlyCurrentFocus ? 'true' : 'false'
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

$scope.resetLevelOfChapterCards = function( chapterId, level ) {

    const selectedChapters = [];
    selectedChapters.push( chapterId ) ;
    callResetLevelServerAPI( selectedChapters, level ) ;
}

$scope.resetLevelOfAllCardsForSelectedChapters = function( level ) {
    const selectedChapters = getSelectedChapterIds();
    callResetLevelServerAPI( selectedChapters, level ) ;
}

$scope.tempPromotionAction = function() {
    const selectedChapters = getSelectedChapterIds();
    callTempPromotionServerAPI( selectedChapters ) ;
}

$scope.launchNotes = function( levels ) {

    let chapters = getChapterWithCardsAtLevel( levels ) ;

    const chapterIds = [];
    for( let i=0; i<chapters.length; i++ ) {
        chapterIds.push( chapters[i].chapterId ) ;
    }

    let url = "/apps/jove_notes/ng/notes_chained/index.php";
    url += "?levels=" + levels.join() ;
    url += "&chapterIds=" + chapterIds.join() ;

    window.location.href = url ;
}

$scope.launchChainedFlashcards = function( type ) {

    let chapters = null;

    if( type === 'randomize' ||
        type === 'ordered'   ||
        type === 'retention' ||
        type === 'urgency' ) {
        chapters = getSelectedChapterRows() ;
    }
    else if( type === 'current_focus' ) {
        chapters = getCurrentFocusChapterRows() ;
    }
    else if( type === 'syllabus' ) {
        chapters = getInSyllabusChapterRows() ;
    }

    if( chapters == null || chapters.length === 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected or the " + 
                     "selected chapters don't have available cards." ) ;
        return ;
    }

    if( type === 'randomize' ) {
        chapters.shuffle() ;
    }
    else if( type === 'urgency' ) {
        chapters.sort( function( c1, c2 ){
            return c2.urgencyScore - c1.urgencyScore ;
        }) ;
    }
    else if( type === 'retention' ) {
        chapters.sort( function( c1, c2 ){
            return c1.retentionScore - c2.retentionScore ;
        }) ;
    }
    else if( type === 'syllabus' ) {
        chapters.sort( function( c1, c2 ){
            return c1.preparednessScore - c2.preparednessScore ;
        }) ;
    }

    const selectedChapters = [];
    for(let i=0; i<chapters.length; i++ ) {
        if( chapters[i].hasCardsAvailable() ) {
            selectedChapters.push( chapters[i].chapterId ) ;
        }
    }

    let url = "/apps/jove_notes/ng/flashcard/index.php";
    url += "?chapterId=" + selectedChapters.join() ;

    window.location.href = url ;
}

$scope.toggleVisibilityInBulk = function() {

    const selectedChapterRows = getSelectedChapterRows();
    const visibilityData = [];

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
      'saveStateName' : "treeState-" + currentUserName 
    }); 
    recomputeStatistics() ;
    $scope.$digest() ;
} ) ;

$scope.toggleLevelFilter = function( level ) {
    if( level === 'L0' ) {
        $scope.showOnlyChaptersWithL0Cards = !$scope.showOnlyChaptersWithL0Cards ;
    }
    else if( level === 'NR' ) {
        $scope.showOnlyChaptersWithNRCards = !$scope.showOnlyChaptersWithNRCards ;
    }
    else if( level === 'NS' ) {
        $scope.showOnlyChaptersWithNSCards = !$scope.showOnlyChaptersWithNSCards ;
    }
}

$scope.getLevelFilterCellClass = function( level ) {
    if( ( level === 'L0' && $scope.showOnlyChaptersWithL0Cards ) ||
        ( level === 'NS' && $scope.showOnlyChaptersWithNSCards ) ||
        ( level === 'NR' && $scope.showOnlyChaptersWithNRCards ) ) {
        return "hdr-level-selected" ;
    }
    return "" ;
}

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

    $http.get( "/jove_notes/api/ProgressSnapshot" )
         .success( function( data ){
            console.log( data ) ;
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
    $scope.syllabusMerged       = preferences[ "jove_notes.syllabusMerged" ] ;
    $scope.showOnlyCurrentFocus = preferences[ "jove_notes.showOnlyCurrentFocus" ] ;
}

function prepareDataForDisplay( rawData ) {

    if( $scope.syllabusMerged ) {
        return prepareDataForDisplayGroupedBySubject( rawData ) ;
    }
    else {
        return prepareDataForDisplayGroupedBySyllabus( rawData ) ;
    }
}

function prepareDataForDisplayGroupedBySyllabus( rawData ) {

    const displayData = [];
    let rowNum = 0;

    for( let sylIndex=0; sylIndex<rawData.length; sylIndex++ ) {

        rowNum++ ;
        const syllabus = rawData[sylIndex];
        const syllabusRD = new RowData(RowData.prototype.ROW_TYPE_SYLLABUS,
                                                    syllabus.syllabusName,
                                                    syllabus.syllabusName, -1);

        displayData.push( syllabusRD ) ;

        let numSubjectsSelected = 0;

        for( let subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

            rowNum++ ;
            const subject = syllabus.subjects[subIndex];
            const subjectRD = new RowData(RowData.prototype.ROW_TYPE_SUBJECT,
                                                    subject.subjectName,
                                                    syllabus.syllabusName + "-" + subject.subjectName,
                                                    syllabusRD.rowId);

            syllabusRD.addChild( subjectRD ) ;
            displayData.push( subjectRD ) ;

            let numChaptersSelected = 0;
            for( let chpIndex=0; chpIndex<subject.chapters.length; chpIndex++ ) {

                rowNum++ ;
                const chapter = subject.chapters[chpIndex];
                const displayName = chapter.chapterNum + "." + chapter.subChapterNum +
                                           " - " + chapter.chapterName;
                const chapterRD = new RowData(RowData.prototype.ROW_TYPE_CHAPTER,
                                                        displayName,
                                                        chapter.chapterId,
                                                        subjectRD.rowId);

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

function prepareDataForDisplayGroupedBySubject( rawData ) {

    const syllabusRD = new RowData(RowData.prototype.ROW_TYPE_SYLLABUS,
                                       "Unified Syllabus", "Unified", -1);
    const subjectMap = {};
    const displayData = [];
    let rowNum = 0;

    displayData.push( syllabusRD ) ;

    for( let sylIndex=0; sylIndex<rawData.length; sylIndex++ ) {

        rowNum++ ;
        const syllabus = rawData[sylIndex];
        let numSubjectsSelected = 0;

        for( let subIndex=0; subIndex<syllabus.subjects.length; subIndex++ ) {

            rowNum++ ;
            const subject = syllabus.subjects[subIndex];
            let subjectRD = null;

            if( subjectMap[ subject.subjectName ] ) {
                subjectRD = subjectMap[ subject.subjectName ] ;
            }
            else {
                subjectRD = new RowData( RowData.prototype.ROW_TYPE_SUBJECT, 
                                         subject.subjectName, 
                                         syllabusRD.name + "-" + subject.subjectName, 
                                         syllabusRD.rowId ) ;
                subjectMap[ subject.subjectName ] = subjectRD ;
            }

            syllabusRD.addChild( subjectRD ) ;

            let numChaptersSelected = 0;
            for( let chpIndex=0; chpIndex<subject.chapters.length; chpIndex++ ) {

                rowNum++ ;
                const chapter = subject.chapters[chpIndex];
                const displayName = chapter.chapterNum + "." + chapter.subChapterNum +
                                           " - " + chapter.chapterName;
                const chapterRD = new RowData(RowData.prototype.ROW_TYPE_CHAPTER,
                    displayName,
                    chapter.chapterId,
                    subjectRD.rowId);

                chapterRD.setChapterAndParentRows( chapter, subjectRD, syllabusRD ) ;

                subjectRD.addChild( chapterRD ) ;

                if( !chapterRD.isHidden && chapterRD.isRowSelected ) {
                    numChaptersSelected++ ;
                }
            }

            subjectRD.isRowSelected = ( numChaptersSelected > 0 ) ;
            if( subjectRD.isRowSelected ) numSubjectsSelected++ ;
        }

        syllabusRD.isRowSelected = ( numSubjectsSelected > 0 ) ;
    }

    for( const subName in subjectMap ) {
        const subRD = subjectMap[subName];
        displayData.push( subRD ) ;

        subRD.children.sort( function( a, b ){
            return a.chapterId - b.chapterId ;
        }) ;

        for( let i=0; i<subRD.children.length; i++ ) {
            displayData.push( subRD.children[i] ) ;
        }
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
        const rowData = $scope.progressSnapshot[i];
        if( rowData.rowType !== RowData.prototype.ROW_TYPE_CHAPTER ) {

            rowData.totalCards         = 0 ;
            rowData.notStartedCards    = 0 ;
            rowData.resurrectedCards   = 0 ;
            rowData.l0Cards            = 0 ;
            rowData.l1Cards            = 0 ;
            rowData.l2Cards            = 0 ;
            rowData.l3Cards            = 0 ;
            rowData.masteredCards      = 0 ;
            rowData.pctSectionsActive = 0 ;

            rowData.numSSRMaturedCards           = 0 ;
            rowData.numSSRInSyllabusMaturedCards = 0 ;

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

            if( rowData.isChapterRow() ) {
                drawActiveSectionsPercentage( "secActivePct-" + rowData.rowId,
                                              rowData.pctSectionsActive ) ;
            }
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

    subjectRD.pctNS                = subjectRD.notStartedCards / subjectRD.totalCards ;
    subjectRD.pctNR                = subjectRD.resurrectedCards/ subjectRD.totalCards ;
    subjectRD.pctL0                = subjectRD.l0Cards         / subjectRD.totalCards ;
    subjectRD.pctL1                = subjectRD.l1Cards         / subjectRD.totalCards ;
    subjectRD.pctL2                = subjectRD.l2Cards         / subjectRD.totalCards ;
    subjectRD.pctL3                = subjectRD.l3Cards         / subjectRD.totalCards ;
    subjectRD.pctMAS               = subjectRD.masteredCards   / subjectRD.totalCards ;
    subjectRD.projectedMarks       = ( subjectRD.pctMAS + subjectRD.pctL3 + 
                                       subjectRD.pctL2*0.75 + subjectRD.pctL1*0.5 + 
                                       subjectRD.pctL0*0.25 )*100 ;

    subjectRD.numSSRMaturedCards           += chapter.numSSRMaturedCards ;
    subjectRD.numSSRInSyllabusMaturedCards += chapter.isInSyllabus ? chapter.numSSRMaturedCards : 0 ;

    syllabusRD.totalCards         += chapter.totalCards ;
    syllabusRD.notStartedCards    += chapter.notStartedCards ;
    syllabusRD.resurrectedCards   += chapter.nrCards ;
    syllabusRD.l0Cards            += chapter.l0Cards ;
    syllabusRD.l1Cards            += chapter.l1Cards ;
    syllabusRD.l2Cards            += chapter.l2Cards ;
    syllabusRD.l3Cards            += chapter.l3Cards ;
    syllabusRD.masteredCards      += chapter.masteredCards ;

    syllabusRD.pctNS               = syllabusRD.notStartedCards / syllabusRD.totalCards ;
    syllabusRD.pctNR               = syllabusRD.resurrectedCards / syllabusRD.totalCards ;
    syllabusRD.pctL0               = syllabusRD.l0Cards         / syllabusRD.totalCards ;
    syllabusRD.pctL1               = syllabusRD.l1Cards         / syllabusRD.totalCards ;
    syllabusRD.pctL2               = syllabusRD.l2Cards         / syllabusRD.totalCards ;
    syllabusRD.pctL3               = syllabusRD.l3Cards         / syllabusRD.totalCards ;
    syllabusRD.pctMAS              = syllabusRD.masteredCards   / syllabusRD.totalCards ;
    syllabusRD.projectedMarks      = ( syllabusRD.pctMAS + syllabusRD.pctL3 + 
                                       syllabusRD.pctL2*0.75 + syllabusRD.pctL1*0.5 + 
                                       syllabusRD.pctL0*0.25 )*100 ;

    syllabusRD.numSSRMaturedCards += chapter.numSSRMaturedCards ;
    syllabusRD.numSSRInSyllabusMaturedCards += chapter.isInSyllabus ? chapter.numSSRMaturedCards : 0 ;
}

function drawProgressBar( canvasId, total, vN, vR, v0, v1, v2, v3, v4 ) {

    const c = document.getElementById(canvasId);
    const ctx = c.getContext("2d");

    const widths = [];

    widths[0] = Math.round( ( vN/total )*c.width ) ;
    widths[1] = Math.round( ( vR/total )*c.width ) ;
    widths[2] = Math.round( ( v0/total )*c.width ) ;
    widths[3] = Math.round( ( v1/total )*c.width ) ;
    widths[4] = Math.round( ( v2/total )*c.width ) ;
    widths[5] = Math.round( ( v3/total )*c.width ) ;
    widths[6] = Math.round( ( v4/total )*c.width ) ;

    const colors = ["#FF0000", //NS
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

function drawActiveSectionsPercentage( canvasId, activePct ) {

    const c = document.getElementById(canvasId);
    const ctx = c.getContext("2d");

    if( activePct > 0 && activePct < 100 ) {
        const widths = [];

        widths[0] = Math.round( (activePct/100)*c.width ) ;
        widths[1] = Math.round( (1 - activePct/100)*c.width ) ;

        const colors = [
            "#00FF00", // Active Sections
            "#fd7676"  // Inactive sections
        ];

        let curX = 0;
        for( let i=0; i<2; i++ )  {
            ctx.fillStyle = colors[i] ;
            ctx.fillRect( curX, 0, widths[i], c.height ) ;
            curX += widths[i] ;
        }
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
            if( rowData.isTreeRowVisible() && 
                rowData.isRowSelected ) {
                selectedRows.push( rowData ) ;
            }
        }
    }
    return selectedRows ;
}

function getChapterWithCardsAtLevel( levels ) {

    let qualifiedChapters = [] ;

    let selectedChapters = getSelectedChapterRows() ;
    if( selectedChapters.length === 0 ) {
        selectedChapters = $scope.progressSnapshot ;
    }

    for( let i=0; i<selectedChapters.length; i++ ) {

        let rowData = selectedChapters[i] ;
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() &&
                rowData.isRowInCurrentFocus &&
                rowData.hasCardsAvailable() ) {

                for( let j=0; j<levels.length; j++ ) {
                    let level = levels[j] ;
                    let addRow = false ;
                    switch( level ) {
                        case 'NS':  addRow = rowData.notStartedCards > 0 ; break ;
                        case 'L0':  addRow = rowData.l0Cards         > 0 ; break ;
                        case 'L1':  addRow = rowData.l1Cards         > 0 ; break ;
                        case 'L2':  addRow = rowData.l2Cards         > 0 ; break ;
                        case 'L3':  addRow = rowData.l3Cards         > 0 ; break ;
                        case 'MAS': addRow = rowData.masteredCards   > 0 ; break ;
                    }

                    if( addRow ) {
                        qualifiedChapters.push( rowData ) ;
                        break ;
                    }
                }
            }
        }
    }
    return qualifiedChapters ;
}

function getCurrentFocusChapterRows() {

    let currentFocusRows = [] ;
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {

        let rowData = $scope.progressSnapshot[i] ;
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isTreeRowVisible() &&
                rowData.isRowInCurrentFocus &&
                rowData.hasCardsAvailable() ) {

                currentFocusRows.push( rowData ) ;
            }
        }
    }
    return currentFocusRows ;
}

function getInSyllabusChapterRows() {

    const inSyllabusRows = [];
    for( let i=0; i<$scope.progressSnapshot.length; i++ ) {

        const rowData = $scope.progressSnapshot[i];
        if( rowData.rowType === RowData.prototype.ROW_TYPE_CHAPTER ) {
            if( rowData.isRowInSyllabus && 
                rowData.hasCardsAvailable() ) {

                inSyllabusRows.push( rowData ) ;
            }
        }
    }
    return inSyllabusRows ;
}

function callResetLevelServerAPI( selectedChapters, level ) {

    if( selectedChapters.length === 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        log.debug( "Applying level " + level + " to all cards for " +
                   "chapters " + selectedChapters.join() ) ;

        $http.post( '/jove_notes/api/ResetLevel', { 
            chapterIds : selectedChapters,
            level      : level,
            entityType : 'Chapter'
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

function callTempPromotionServerAPI( selectedChapters ) {

    if( selectedChapters.length === 0 ) {
        $scope.$parent.addErrorAlert( "No chapters selected." ) ;
    }
    else {
        $http.post( '/jove_notes/api/TempPromotion', { 
            chapterIds : selectedChapters
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