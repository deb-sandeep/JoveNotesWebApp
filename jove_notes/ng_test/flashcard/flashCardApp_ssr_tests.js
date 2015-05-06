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

}) ;

beforeEach( module( 'flashCardApp' ) ) ;

beforeEach( inject( function( $rootScope, $httpBackend, $controller, $route, $location ) {

    jasmine.getJSONFixtures().fixturesPath='base/api_test_data/flashcard';

    route = $route ;
    location = $location ;

    httpBackend = $httpBackend ;
    httpBackend.when( 'GET', '/jove_notes/api/FlashCard/23' )
               .respond( getJSONFixture( 'flashcard_ssr.json' ) ) ;
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

beforeEach( function() {
    jasmine.addMatchers( customMatchers ) ;
}) ;

afterEach( function() {
    httpBackend.verifyNoOutstandingExpectation() ;
    httpBackend.verifyNoOutstandingRequest() ;
} ) ;

// ------------------------- Test Data -----------------------------------------
// L0 should get picked up after 1 day
// L1 should get picked up after 2 day
// L2 should get picked up after 3 day
// L3 should get picked up after 4 day
// Q | L  | LAT | I | T | Tdelta
// ---------------------|----------------------------------------
// 1 | L0 |  0  | N | 1 | -1
// 2 | L0 | -1  | Y | 1 |  0
// 3 | L0 | -2  | Y | 1 |  1
// 4 | L1 |  0  | N | 2 | -2
// 5 | L1 | -1  | N | 2 | -1
// 6 | L1 | -2  | Y | 2 |  0
// 7 | L2 | -2  | N | 3 | -1
// 8 | L2 | -3  | Y | 3 |  0
// 9 | L3 | -3  | N | 4 | -1
//10 | L3 | -6  | Y | 4 |  2
//
// Therefore
//   Questions present - 2, 3, 6, 8, 10
//   Questions absent  - 1, 4, 5, 7, 9
//
//   Order of questions
it( 'Only have questions whose threshold delta >=0', function(){

    flashCardScope.studyCriteria.setDefaultCriteria() ;

    createStartPgCtlr() ;
    createPracticePgCtlr() ;

    expect( practicePgScope.questionsForSession )
        .toHaveQuestion( [ 2, 3, 6, 8, 10 ] ) ;
}) ;

it( 'should not have questions whose threshold delta <0', function(){

    flashCardScope.studyCriteria.setDefaultCriteria() ;

    createStartPgCtlr() ;
    createPracticePgCtlr() ;

    expect( practicePgScope.questionsForSession )
        .not.toHaveQuestion( [ 1, 4, 5, 7, 9 ] ) ;
}) ;

it( 'should sort questions in descending order of threshold delta', function(){

    flashCardScope.studyCriteria.setDefaultCriteria() ;

    createStartPgCtlr() ;
    createPracticePgCtlr() ;

    expect( practicePgScope.questionsForSession )
        .toHaveQuestionsInOrder( [ 10, 3 ] ) ;
}) ;

// -----------------------------------------------------------------------------
});
