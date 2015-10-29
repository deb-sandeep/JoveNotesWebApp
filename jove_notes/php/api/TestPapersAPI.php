<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/test_papers/snapshot_action.php" ) ;

class TestPapersAPI extends API {

	function __construct() {
		parent::__construct() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in TestPapersAPI" ) ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "Request is for entity $entityName" ) ;

		if( $entityName == 'Snapshot' ) {
			$action = new SnapshotAction() ;
		}
		
		$action->execute( $request, $response ) ;
	}


	// =========================================================================

}

?>