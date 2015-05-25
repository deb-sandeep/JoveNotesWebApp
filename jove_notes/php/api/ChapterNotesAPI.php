<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/api_bootstrap.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/notes_element_dao.php" ) ;

class ChapterNotesAPI extends API {

	private $chapterDAO   = null ;
	private $neDAO        = null ;

	private $chapterId    = 0 ;
	private $chapterDetail= null ;
	private $chapterGuard = null ;

	function __construct() {
		parent::__construct() ;
		$this->chapterDAO = new ChapterDAO() ;
		$this->neDAO      = new NotesElementDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ChapterNotesAPI" ) ;
		$this->chapterId = $request->requestPathComponents[0] ;

		$this->logger->debug( "Chapter ID = " . $this->chapterId ) ;
		$this->chapterDetails = $this->constructChapterDetails() ;

		$this->logger->debug( "Chapter guard = " . $this->chapterGuard ) ;

		if( !Authorizer::hasAccess( $this->chapterGuard, "NOTES" ) ) {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "Unauthorized access." ;
		}
		else {
			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $this->constructResponseBody() ;
		}
	}

	private function constructResponseBody() {

		$responseBody = array() ;
		$responseBody[ "chapterDetails" ] = $this->chapterDetails ;
		$responseBody[ "notesElements"  ] = $this->constructNotesElements() ;

		return $responseBody ;
	}

	private function constructChapterDetails() {

		$chapDetails = array() ;
		$meta = $this->chapterDAO->getChapterMetaData( $this->chapterId ) ;
		if( $meta == null ) {
			throw new Exception( "Chapter not found" ) ;
		}
		$this->logger->debug( $meta ) ;

		$this->chapterGuard = $meta[ "guard" ] ;		
		$chapDetails[ "chapterId"        ] = $meta[ "chapter_id"      ] ;
		$chapDetails[ "syllabusName"     ] = $meta[ "syllabus_name"   ] ;
		$chapDetails[ "subjectName"      ] = $meta[ "subject_name"    ] ;
		$chapDetails[ "chapterNumber"    ] = $meta[ "chapter_num"     ] ;
		$chapDetails[ "subChapterNumber" ] = $meta[ "sub_chapter_num" ] ;
		$chapDetails[ "chapterName"      ] = $meta[ "chapter_name"    ] ;

		return $chapDetails ;		
	}

	private function constructNotesElements() {

		$notesElements = array() ;

		$neDataArray = $this->neDAO->getNoteElements( $this->chapterId ) ;
		if( $neDataArray != null ) {
			if( gettype( $neDataArray ) == "array" ) {
				foreach( $neDataArray as $neData ) {
					array_push( $notesElements, $this->constructNotesElement( $neData ) ) ;
				}
			}
			else {
				array_push( $notesElements, $this->constructNotesElement( $neData ) ) ;
			}
		}
		return $notesElements ;
	}

	private function constructNotesElement( $neData ) {

		$element = array() ;

		$element[ "noteElementId"   ] = $neData[ "notes_element_id" ] ;
		$element[ "elementType"     ] = $neData[ "element_type" ] ;
		$element[ "difficultyLevel" ] = $neData[ "difficulty_level" ] ;
		$element[ "learningStats"   ] = array( "learningEfficiency" => 80 ) ;

		$this->injectNEContent( $element, $neData[ "content" ] ) ;

		return $element ;
	}

	private function injectNEContent( &$element, $content ) {

		$this->logger->debug( "Extracting from content " . $content ) ;
		$contentArr = json_decode( $content, true ) ;
		foreach( $contentArr as $key => $value ) {
			$element[ $key ] = $value ;
		}
	}

	// Set the responseBody to the output of this function if we want to send 
	// back a prefabricated reference JSON.
	private function getReferenceOutput() {
		return file_get_contents( DOCUMENT_ROOT . 
			       "/apps/jove_notes/api_test_data/notes/chapter_notes.json" ) ;
	}

}

?>