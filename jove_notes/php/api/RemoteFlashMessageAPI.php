<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/remote_flash_queue_dao.php" ) ;

class RemoteFlashMessageAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $queueDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->queueDAO = new RemoteFlashQueueDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doPost in RemoteFlashMessageAPI" ) ;

		$lastMessageId = $request->parametersMap[ "lastMessageId" ] ;
		$this->logger->debug( "Last message ID = $lastMessageId"  ) ;

		$responseBody = $this->getPendingMessages( $lastMessageId ) ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseBody ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in RemoteFlashMessageAPI" ) ;
		$this->requestObj = $request->requestBody ;

		if( $this->isUserEntitledForFlashCards( $this->requestObj->chapterId ) ) {

			$this->processIncomingMessage( $this->requestObj ) ;
			$response->responseCode = APIResponse::SC_OK ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "RemoteFlashMessage " ;
		}
	}

	private function processIncomingMessage( $message ) {

		if( $message->msgType == "start_session" ) {
			$this->logger->debug( "Purging messages for session older than " . 
				                  $message->sessionId ) ;

			$this->queueDAO->purgePreviousSessionMessages( 
										ExecutionContext::getCurrentUserName(),
										$message->sessionId ) ;
		}
		
		if( $message->msgType == "purge_session" ) {
			$this->logger->debug( "Purging messages for this and older sessions" . 
				                  $message->sessionId ) ;

			$this->queueDAO->purgePreviousSessionMessages( 
										ExecutionContext::getCurrentUserName(),
										$message->sessionId+1 ) ;
			// We don't save this message. This is just for clearing up the queue.
			return ; 
		}

		$this->queueDAO->addMessage( ExecutionContext::getCurrentUserName(), 
									 $message->sessionId,
			                         $message->msgType,
			                         $message->msgContent ) ;
		
		$this->logger->debug( "Message of type " . $this->requestObj->msgType 
			                                     . " saved" ) ;
	}

	private function getPendingMessages( $lastMessageId ) {

		$this->logger->debug( "Getting all pending messages from $lastMessageId" ) ;

		$userName = ExecutionContext::getCurrentUserName() ;
		$messages = array() ;

		$latestMsgStats = $this->queueDAO->getLastMessageAgeAndId( $userName ) ;

		if( $latestMsgStats == null ) {
			// If there are zero messages in the queue for this user. We 
			// tell the user that the session is yet to begin.
			$this->logger->debug( "There are no messages in queue. Sending YTS message" ) ;
			array_push( $messages, $this->getYetToStartMessage() ) ;
		}
		else {
			$latestMsgId  = $latestMsgStats[ "id"  ] ;
			$latestMsgAge = $latestMsgStats[ "age" ] ;

			if( $latestMsgId <= $lastMessageId ) {
				// This implies that the user has received all the messages 
				// till this point in time. We send an empty array back.
				$this->logger->debug( "No new messages for the user" ) ;
			}
			else {
				// If the user has sent us a last message id of -1, and the 
				// latest message age is greater than 30 minutes. We send the
				// user an yet to start message.
				if( $latestMsgAge >= 30*60 ) {
					// If the last message for this user was 30 minutes old, it implies
					// stale sessions. We delete all the old messages and tell the user
					// to wait for his session to begin.
					$this->logger->debug( "Very stale message. Seting YTS message" ) ;

					$this->queueDAO->purgeAllMessages( $userName ) ;
					array_push( $messages, $this->getYetToStartMessage() ) ;
				}
				else {
					// We fetch all the messages whose id is >= the supplied
					// message id and send them to the user.
					$dbMsgs = $this->queueDAO->getAllMessages( 
										           $userName, $lastMessageId ) ;
					
					foreach( $dbMsgs as $msg ) {
						array_push( $messages, $this->convertDBMsg( $msg ) ) ;
					}
					$this->logger->debug( "Sending " . count( $messages ) ) ;
				}
			}
		}

		return $messages ;
	}

	private function convertDBMsg( $dbMsg ) {

		$message = array() ;

		$message[ "id"        ] = $dbMsg[ "id"         ] ;
		$message[ "sessionId" ] = $dbMsg[ "session_id" ] ;
		$message[ "msgType"   ] = $dbMsg[ "msg_type"   ] ;

		$content = json_decode( $dbMsg[ "msg_content" ], true ) ;

		if( $content == null && json_last_error() !== JSON_ERROR_NONE ) {

			$parseErrMsg = JSONUtils::getJSONErrorMessage( json_last_error() ) ;

			$this->logger->error( "Error parsing JSON. " . $dbMsg[ "msg_content" ] ) ;
			$this->logger->error( "Error message = $parseErrMsg" ) ;

			throw new Exception( "Error parsing JSON - $parseErrMsg" ) ;
		}
		else {
			$message[ "content"   ] = $content ;
		}

		return $message ;
	}

	private function getYetToStartMessage() {

		$message = array() ;

		$message[ "id"       ] = -1 ;
		$message[ "sessionId"] = -1 ;
		$message[ "msgType"  ] = "yet_to_start" ;
		$message[ "content"  ] = null ;
		
		return $message ;
	}
}

?>