var userName  = 'UTUser' ;
var chapterId = 23 ;

describe( 'notesApp basic initialization', function() {

    var scope, httpBackend, controller ;

    beforeEach( module( 'notesApp' ) ) ;

    beforeEach( inject( function( $rootScope, $httpBackend, $controller ) {

        jasmine.getJSONFixtures().fixturesPath='base/api_test_data/';

        scope       = $rootScope.$new() ;
        httpBackend = $httpBackend ;
        httpBackend.when( 'GET', '/jove_notes/api/ChapterNotes' )
                   .respond( getJSONFixture( 'chapter_notes.json' ) ) ;

        controller = $controller( 'NotesController', { '$scope' : scope } ) ;
        scope.filterCriteria.setDefaultCriteria() ;
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
    expect( scope.chapterData ).not.toBeNull() ;
    expect( scope.pageTitle ).toEqual( '[Biology] 3.0 - Digestion, absorption, assimilation' ) ;
}) ;

it( 'associates learning stats with all quesitons', function() {
    httpBackend.flush() ;
    for( var i=0; i<7; i++ ) {
        var question = scope.chapterData.questions[i] ;
        expect( question.learningStats ).toBeDefined() ;
        expect( question.learningStats.questionId ).toEqual( question.questionId ) ;
    }
}) ;

it( 'associates derived attribues to question and learning stats', function() {
    httpBackend.flush() ;
    for( var i=0; i<7; i++ ) {
        var question = scope.chapterData.questions[i] ;
        var learningStats = question.learningStats ;

        expect( learningStats.questionId           ).toBeDefined() ;
        expect( learningStats.numAttempts          ).toBeDefined() ;
        expect( learningStats.learningEfficiency   ).toBeDefined() ;
        expect( learningStats.currentLevel         ).toBeDefined() ;
        expect( learningStats.lastAttemptTime      ).toBeDefined() ;
        expect( learningStats.temporalScores       ).toBeDefined() ;
        expect( learningStats.numAttemptsInSession ).toBeDefined() ;
        expect( learningStats.numSecondsInSession  ).toBeDefined() ;

        expect( question.difficultyLevelLabel      ).toBeDefined() ;
        expect( question.learningEfficiencyLabel   ).toBeDefined() ;

        expect( question.formattedQuestion         ).toBeDefined() ;
        expect( question.formattedAnswer           ).toBeDefined() ;
        expect( question.answerLength              ).toBeDefined() ;
    }
}) ;

// -----------------------------------------------------------------------------
});
