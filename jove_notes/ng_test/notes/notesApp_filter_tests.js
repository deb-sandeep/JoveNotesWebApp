var userName  = 'UTUser' ;
var chapterId = 23 ;

describe( 'notesApp filter', function() {

    var scope, httpBackend, controller ;

    beforeEach( module( 'notesApp' ) ) ;

    beforeEach( inject( function( $rootScope, $httpBackend, $controller ) {

        jasmine.getJSONFixtures().fixturesPath='base/api_test_data/notes';

        scope       = $rootScope.$new() ;
        httpBackend = $httpBackend ;
        httpBackend.when( 'GET', '/jove_notes/api/ChapterNotes' )
                   .respond( getJSONFixture( 'chapter_notes.json' ) ) ;

        controller =  $controller( 'NotesController', { '$scope' : scope } ) ;
        scope.filterCriteria.setDefaultCriteria() ;
    } ) ) ;

    afterEach( function() {
        httpBackend.verifyNoOutstandingExpectation() ;
        httpBackend.verifyNoOutstandingRequest() ;
    } ) ;

    it( 'can reinitialize itself to default values', function() {
        httpBackend.flush() ;
        expect( scope.filterCriteria.learningEfficiencyFilters )
            .toEqual( [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ) ;
        expect( scope.filterCriteria.difficultyFilters )
            .toEqual( [ "VE", "E",  "M",  "H",  "VH" ] ) ;
    }) ;

    it( 'picks all questions with the default filter', function() {
        httpBackend.flush() ;
        expect( scope.filteredNotesElements.length ).toEqual( 7 ) ;
    }) ;

    it( 'filters based on difficultyLevel criteria', function() {
        httpBackend.flush() ;
        scope.filterCriteria.difficultyFilters = [ "VE" ] ;
        scope.applyFilter() ;
        expect( scope.filteredNotesElements.length ).toEqual( 2 ) ;

        scope.filterCriteria.difficultyFilters = [ "VE", "E" ] ;
        scope.applyFilter() ;
        expect( scope.filteredNotesElements.length ).toEqual( 4 ) ;

        scope.filterCriteria.difficultyFilters = [ "VE", "E", "M" ] ;
        scope.applyFilter() ;
        expect( scope.filteredNotesElements.length ).toEqual( 6 ) ;

        scope.filterCriteria.difficultyFilters = [ "VE", "E", "M", "H" ] ;
        scope.applyFilter() ;
        expect( scope.filteredNotesElements.length ).toEqual( 7 ) ;
    }) ;

});
