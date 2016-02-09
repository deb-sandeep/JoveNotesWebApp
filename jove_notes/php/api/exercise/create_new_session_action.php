<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/chapter_dao.php" ) ;

class CreateNewSessionAction extends APIAction {

    private $chapterDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->chapterDAO = new ChapterDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->error( "Executing CreateNewSessionAction" ) ;

        $chapterIds = $request->requestBody->chapterIds ;
        if( empty( $chapterIds ) ) {
            $response->responseBody = "No chapters specified. Can't create session" ;
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
        }
        else {
            // Create a new exercise session id - ExerciseSessioNDAO
            // For each chapter - create a new learning session
            // Insert exercise session id versus chapter learning session id
            // Return exercise session and the chapter session id map

            $response->responseBody = "Processed request" ;
            $response->responseCode = APIResponse::SC_OK ;
        }
    }
}
?>
