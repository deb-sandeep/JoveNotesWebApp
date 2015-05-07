describe( 'flashCardApp rating', function() {
// -----------------------------------------------------------------------------

var httpBackend, route, location, controller ;
var flashCardScope, startPgScope, practicePgScope, endPgScope ;
var createFlashCardCtlr, createStartPgCtlr, createPracticePgCtlr, createEndPgCtlr ;

var questionsForSession = null ;
var questionToBeRated = null ;
var questionId = null ;

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
        return $controller( 'PracticePageController', { '$scope' : practicePgScope } ) ;
    } ;

    createEndPgCtlr = function() {
        ctlr = $controller( 'EndPageController', { '$scope' : endPgScope } ) ;
        httpBackend.flush() ;
        return ctlr ;
    } ;

} ) ) ;

beforeEach( function() {
    jasmine.addMatchers( customMatchers ) ;
}) ;

beforeEach( function() {

    createFlashCardCtlr() ;
    flashCardScope.studyCriteria.setDefaultCriteria() ;

    createStartPgCtlr() ;
    createPracticePgCtlr() ;

    questionsForSession = practicePgScope.questionsForSession ;
    questionToBeRated = practicePgScope.currentQuestion ;
    questionId = questionToBeRated.questionId ;
}) ;

afterEach( function() {
    httpBackend.verifyNoOutstandingExpectation() ;
    httpBackend.verifyNoOutstandingRequest() ;
} ) ;

// ------------------------- Expectations --------------------------------------
it( 'should remove card from session if rating is E', function(){

    practicePgScope.rateCard( 'E' ) ;
    expect( questionsForSession ).not.toHaveQuestion( questionId ) ;
}) ;

it( 'should remove card from session if rating is A and level is NS', function(){

    questionToBeRated.learningStats.currentLevel = 'NS' ;
    practicePgScope.rateCard( 'E' ) ;

    expect( questionsForSession ).not.toHaveQuestion( questionId ) ;
}) ;

it( 'should reinsert card if rating ^E or [A,P,H] and level != NS for rating A',
    function() {

    var levels  = [ 'NS', 'L0', 'L1', 'L2', 'L3' ] ;
    var ratings = [ 'A', 'P', 'H' ] ;

    for( var l=0; l<levels.length; l++ ) {
        for( var r=0; r<ratings.length; r++ ) {

            // Only for level=NS and rating='A', the card gets removed from
            // the session. Since we are testing that for all others the card
            // gets reinserted, we ignore this condition.
            if( l==0 && r==0 ) continue ;

            questionToBeRated.learningStats.currentLevel = levels[l] ;
            practicePgScope.rateCard( ratings[r] ) ;
            expect( questionsForSession ).toHaveQuestion( questionId ) ;

            questionToBeRated = practicePgScope.currentQuestion ;
            questionId = questionToBeRated.questionId ;
        }
    }
}) ;

it( 'should set the next level based on next level rating matrix',
    function() {

    var levels  = [ 'NS', 'L0', 'L1', 'L2', 'L3' ] ;
    var ratings = [ 'E', 'A', 'P', 'H' ] ;
    var expectedNextLevels = [
        [ 'L1' , 'L1', 'L0', 'L0' ],
        [ 'L1' , 'L0', 'L0', 'L0' ],
        [ 'L2' , 'L1', 'L0', 'L0' ],
        [ 'L3' , 'L1', 'L1', 'L0' ],
        [ 'MAS', 'L0', 'L0', 'L0' ]
    ] ;

    for( var l=0; l<levels.length; l++ ) {
        for( var r=0; r<ratings.length; r++ ) {

            var numQuestions = questionsForSession.length ;

            questionToBeRated.learningStats.currentLevel = levels[l] ;
            practicePgScope.rateCard( ratings[r] ) ;

            expect( questionToBeRated.learningStats.currentLevel )
                .toBe( expectedNextLevels[l][r] ) ;

            // If the number of questions have decreased, it implies that the 
            // card has been removed from session. In this case, we reinsert the
            // casd back so that we don't run into an empty session.
            if( questionsForSession.length < numQuestions ) {
                questionsForSession.push( questionToBeRated ) ;
            }

            questionToBeRated = practicePgScope.currentQuestion ;
            questionId = questionToBeRated.questionId ;
        }
    }
}) ;

// -----------------------------------------------------------------------------
});
