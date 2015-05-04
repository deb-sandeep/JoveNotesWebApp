var userName  = 'UTUser' ;
var chapterId = 23 ;

describe( 'notesApp', function() {

    var scope, httpBackend, controller ;

    beforeEach( module( 'notesApp' ) ) ;

    beforeEach( inject( function( $rootScope, $httpBackend, $controller ) {

        jasmine.getJSONFixtures().fixturesPath='base/api_test_data/';

        scope       = $rootScope.$new() ;
        httpBackend = $httpBackend ;
        httpBackend.when( 'GET', '/jove_notes/api/ChapterNotes' )
                   .respond( getJSONFixture( 'chapter_notes.json' ) ) ;

        controller =  $controller( 'NotesController', { '$scope' : scope } ) ;
    } ) ) ;

    afterEach( function() {
        httpBackend.verifyNoOutstandingExpectation() ;
        httpBackend.verifyNoOutstandingRequest() ;
    } ) ;

    it( 'receives and stores the global variable userName', function() {
        httpBackend.flush() ;
        expect( scope.userName ).toEqual( 'UTUser' ) ;
    }) ;

    it( 'receives and stores the global variable chapterId', function() {
        httpBackend.flush() ;
        expect( scope.chapterId ).toEqual( 23 ) ;
    }) ;

    it( 'constructs page title from server data', function() {
        httpBackend.flush() ;
        expect( scope.pageTitle ).toEqual( '[Biology] 3.0 - Digestion, absorption, assimilation' ) ;
    }) ;
});
