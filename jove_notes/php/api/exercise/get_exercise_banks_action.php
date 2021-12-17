<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/chapter_dao.php" ) ;

class GetExerciseBanksAction extends APIAction {

    private $chapterDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->chapterDAO = new ChapterDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing GetExerciseBanksAction" ) ;

        $chapterIds = $request->getPathComponent( 1 ) ;
        if( $chapterIds == NULL || $chapterIds == '' ) {

            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Chapter ids have not been specified" ;
        }
        else {
            $chapterIdList     = explode( ",", $chapterIds ) ;
            $chapterIdGuardMap = $this->chapterDAO->getChapterGuardMap( $chapterIdList ) ;
            $entitledChapters  = array() ;

            for( $i=0; $i<count($chapterIdList); $i++ ) {
                $chapterId = $chapterIdList[$i] ;

                if( array_key_exists( $chapterId, $chapterIdGuardMap ) ) {

                    $chapterGuard = $chapterIdGuardMap[ $chapterId ] ;
                    if( Authorizer::hasAccess( $chapterGuard, "FLASH_CARD" ) ) {
                        array_push( $entitledChapters, $chapterId ) ;
                    }
                    else {
                        $this->logger->warn( "User does not have FLASH_CARD " .
                                             "access to chapter $chapterId." ) ;
                    }
                }
                else {
                    $this->logger->warn( "Chapter $chapterId not found." ) ;
                }
            }

            if( empty( $entitledChapters ) ) {

                $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
                $response->responseBody = "Specified chapters were either not ".
                    "found or the user is entitled to the chapters specified." ;
            }
            else {

                $pcSvc = new PracticeCardService() ;
                $pcSvc->setForExercise() ;

                $response->responseBody = $pcSvc->getPracticeCardDetails( $entitledChapters ) ;
                $response->responseCode = APIResponse::SC_OK ;
            }
        }
    }
}
?>
