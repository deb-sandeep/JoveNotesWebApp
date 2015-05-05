var userName  = 'UTUser' ;
var chapterId = 23 ;
var log = null ;
var __debug__ = true ;

describe( 'flashCardApp basic initialization', function() {
// -----------------------------------------------------------------------------

var httpBackend, route, location, controller ;
var flashCardScope, startPgScope, practicePgScope, endPgScope ;
var createFlashCardCtlr, createStartPgCtlr, createPracticePgCtlr, createEndPgCtlr ;

var staticPages = [
    '/jove_notes/api/FlashCard/23',
    '/apps/jove_notes/ng/flashcard/start_page/main.html',
    '/apps/jove_notes/ng/flashcard/practice_page/main.html',
    '/apps/jove_notes/ng/flashcard/end_page/main.html'
] ;

beforeAll( function() {

    log = log4javascript.getLogger( "main" ) ;
    var appender = new log4javascript.BrowserConsoleAppender() ;
    var layout   = new log4javascript.PatternLayout( "[%-5p] %m" ) ;

    appender.setLayout( layout ) ;
    appender.setThreshold( log4javascript.Level.DEBUG ) ;

    log.addAppender( appender ) ;
}) ;

beforeEach( module( 'flashCardApp' ) ) ;

beforeEach( inject( function( $rootScope, $httpBackend, $controller, $route, $location ) {

    jasmine.getJSONFixtures().fixturesPath='base/api_test_data/flashcard';

    route = $route ;
    location = $location ;

    httpBackend = $httpBackend ;
    httpBackend.when( 'GET', '/jove_notes/api/FlashCard/23' )
               .respond( getJSONFixture( 'flashcard_simple.json' ) ) ;
    for( var i=0; i<staticPages.length; i++ ) {
        httpBackend.when( 'GET', staticPages[i] ).respond( 200 ) ;
    }

    flashCardScope  = $rootScope ;
    startPgScope    = flashCardScope.$new() ;
    practicePgScope = flashCardScope.$new() ;
    endPgScope      = flashCardScope.$new() ;

    createFlashCardCtlr = function() {
        ctlr = $controller( 'FlashCardController', { '$scope' : flashCardScope  } ) ;
        httpBackend.flush() ;
        return ctlr ;
    } ;

    createStartPgCtlr = function() {
        ctlr = $controller( 'StartPageController', { '$scope' : startPgScope } ) ;
        httpBackend.flush() ;
        return ctlr ;
    } ;

    createPracticePgCtlr = function() {
        ctlr = $controller( 'PracticePageController', { '$scope' : practicePgScope } ) ;
        return ctlr ;
    } ;

    createEndPgCtlr = function() {
        ctlr = $controller( 'EndPageController', { '$scope' : endPgScope } ) ;
        httpBackend.flush() ;
        return ctlr ;
    } ;

    createFlashCardCtlr() ;
} ) ) ;

afterEach( function() {
    httpBackend.verifyNoOutstandingExpectation() ;
    httpBackend.verifyNoOutstandingRequest() ;
} ) ;

it( 'constructs page title from server data', function() {

    createStartPgCtlr() ;

    expect( flashCardScope.chapterData ).not.toBeNull() ;
    expect( flashCardScope.pageTitle ).toEqual( '[Biology] 3.0 - Digestion, absorption, assimilation' ) ;
}) ;

it( 'associates derived attribues to question and learning stats', function() {
    
    createStartPgCtlr() ;

    for( var i=0; i<7; i++ ) {
        var question = flashCardScope.chapterData.questions[i] ;
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

// ------------------------- Test Data -----------------------------------------
// Q | D  | #A  | Ef  | L  | LAT |
// -----------------------------------------------------------------------------
// 1 | VE |  2  |  A1 | L2 | -5  |                                              
// 2 | E  |  2  |  A2 | L0 | -5  |                                              
// 3 | H  |  6  |  B2 | L1 | -5  |                                              
// 4 | H  |  8  |  B2 | L3 | -5  |                                              
// 5 | VH | 10  |  C1 | MAS| -5  |                                              
// 6 | VE |  6  |  A1 | L3 | -5  |                                              
// 7 | VH |  7  |  A1 | L3 | -5  |                                              
it( 'should initialize practice page controller', function(){

    flashCardScope.studyCriteria.setDefaultCriteria() ;

    createStartPgCtlr() ;
    createPracticePgCtlr() ;

    // Only MAS should get filtered, leaving the other 6 intact
    expect( practicePgScope.sessionStats.numCards ).toEqual( 6 ) ;
}) ;


// -----------------------------------------------------------------------------
});
