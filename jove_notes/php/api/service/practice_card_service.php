<?php
require_once( APP_ROOT . "/php/dao/learning_session_dao.php" ) ;
require_once( APP_ROOT . "/php/dao/card_learning_summary_dao.php" ) ;

class PracticeCardService {

    private $logger ;

    private $lsDAO      = null ;
    private $clsDAO     = null ;
    private $chapterDAO = null ;

    private $chapterId     = 0 ;
    private $chapterDetail = null ;
    private $chapterGuard  = null ;

    private $numCards = 0;
    private $num_VE   = 0;
    private $num_E    = 0;
    private $num_M    = 0;
    private $num_H    = 0;
    private $num_VH   = 0;

    private $forExercise = false ;

    function __construct() {
        $this->logger     = Logger::getLogger( __CLASS__ ) ;
        $this->lsDAO      = new LearningSessionDAO() ;
        $this->clsDAO     = new CardLearningSummaryDAO() ;
        $this->chapterDAO = new ChapterDAO() ;
    }

    public function setForExercise() {
        $this->forExercise = true ;
    }

    public function getPracticeCardDetails( $chapterIds ) {

        $cardDetails = array() ;

        for( $i=0; $i<count($chapterIds); $i++ ) {
            $chapterId = $chapterIds[$i] ;
            array_push( $cardDetails, 
                        $this->getPracticeCardDetailsForChapter( $chapterId ) ) ;
        }

        return $cardDetails ;
    }

    public function getPracticeCardDetailsForChapter( $chapterId ) {

        $meta     = $this->chapterDAO->getChapterMetaData( $chapterId ) ;
        $sections = $this->chapterDAO->getChapterSections( $chapterId ) ;
        if( $meta == null ) {
            throw new Exception( "Chapter not found" ) ;
        }

        $this->parseChapterMeta( $meta ) ;
        $respObj = array() ;

        $respObj[ "chapterDetails" ] = $this->constructChapterDetails( $meta, $sections ) ;
        $respObj[ "deckDetails"    ] = $this->constructDeckDetails() ;
        $respObj[ "questions"      ] = $this->constructQuestions() ;

        return $respObj ;
    }

    private function parseChapterMeta( $meta ) {

        $this->chapterId    = $meta[ "chapter_id" ] ;
        $this->chapterGuard = $meta[ "guard"      ] ;     
        $this->numCards     = $meta[ "num_cards"  ] ;
        $this->num_VE       = $meta[ "num_VE"     ] ;
        $this->num_E        = $meta[ "num_E"      ] ;
        $this->num_M        = $meta[ "num_M"      ] ;
        $this->num_H        = $meta[ "num_H"      ] ;
        $this->num_VH       = $meta[ "num_VH"     ] ;
    }

    private function constructChapterDetails( $meta, $sections ) {

        $chapterDetail = array() ;

        $chapterDetail[ "chapterId"        ] = $meta[ "chapter_id"      ] ;
        $chapterDetail[ "syllabusName"     ] = $meta[ "syllabus_name"   ] ;
        $chapterDetail[ "subjectName"      ] = $meta[ "subject_name"    ] ;
        $chapterDetail[ "chapterNumber"    ] = $meta[ "chapter_num"     ] ;
        $chapterDetail[ "subChapterNumber" ] = $meta[ "sub_chapter_num" ] ;
        $chapterDetail[ "chapterName"      ] = $meta[ "chapter_name"    ] ;
        $chapterDetail[ "scriptBody"       ] = base64_encode( $meta["script_body"] ) ;
        $chapterDetail[ "sections"         ] = $sections ;

        return $chapterDetail ;
    }

    private function constructDeckDetails() {

        $deckDetailsObj = array() ;

        $deckDetailsObj[ "numCards"          ] = $this->numCards ;
        $deckDetailsObj[ "difficultyStats"   ] = $this->constructDifficultyStats() ;

        $this->attachProgressSnapshots( $deckDetailsObj ) ;
        $this->attachDifficultyTimeAverages( $deckDetailsObj ) ;

        return $deckDetailsObj ;
    }

    private function constructDifficultyStats() {

        $difficultyStatsObj = array() ;

        $difficultyStatsObj[ "numVE" ] = $this->num_VE ;
        $difficultyStatsObj[ "numE"  ] = $this->num_E  ;
        $difficultyStatsObj[ "numM"  ] = $this->num_M  ;
        $difficultyStatsObj[ "numH"  ] = $this->num_H  ;
        $difficultyStatsObj[ "numVH" ] = $this->num_VH ;

        return $difficultyStatsObj ;

    }

    private function attachProgressSnapshots( &$deckDetailsObj ) {

        $learningCurveDataObj = array() ;

        $this->logger->debug( "Getting snapshots for " . 
                              ExecutionContext::getCurrentUserName() . " and " .
                              " chapter = " . $this->chapterId ) ;

        $snapshots = $this->lsDAO->getProgressSnapshots( 
                                        ExecutionContext::getCurrentUserName(),
                                        $this->chapterId ) ;

        $this->logger->debug( "Successfully obtained snapshots." ) ;

        $numSnapshots = count( $snapshots ) ;
        if( $numSnapshots == 0 ) {
            array_push( $learningCurveDataObj, 
                        array( $this->numCards, 0, 0, 0, 0, 0 ) ) ;
        }
        else {
            for( $i=0; $i<$numSnapshots; $i++ ) {

                $snapshot = $snapshots[ $i ] ;
                if( $snapshot[ "time_spent" ] > 10 ) {

                    array_push( $learningCurveDataObj, 
                                array( $snapshot["num_NS"],$snapshot["num_L0"], 
                                       $snapshot["num_L1"],$snapshot["num_L2"], 
                                       $snapshot["num_L3"],$snapshot["num_MAS"] ));
                }
            }
        }

        $deckDetailsObj[ "learningCurveData" ] = $learningCurveDataObj ;

        $this->attachLatestProgressSnapshot( $deckDetailsObj ) ;
    }

    private function attachLatestProgressSnapshot( &$deckDetailsObj ) {

        $progressSnapshotObj = array() ;

        $progressSnapshotObj[ "numNS"  ] = 0 ;
        $progressSnapshotObj[ "numL0"  ] = 0 ;
        $progressSnapshotObj[ "numL1"  ] = 0 ;
        $progressSnapshotObj[ "numL2"  ] = 0 ;
        $progressSnapshotObj[ "numL3"  ] = 0 ;
        $progressSnapshotObj[ "numMAS" ] = 0 ;

        $snapshots = $this->clsDAO->getChapterWiseLevelCounts( 
                                            ExecutionContext::getCurrentUserName(),
                                            array( $this->chapterId ) ) ;
        $numSnapshots = count( $snapshots ) ;

        if( $numSnapshots == 0 ) {
            $progressSnapshotObj[ "numNS" ] = $this->numCards ;
        }
        else {
            for( $i=0; $i<count($snapshots); $i++ ) {

                $snapshot     = $snapshots[ $i ] ;
                $count        = $snapshot[ "count" ] ;
                $currentLevel = $snapshot[ "current_level" ] ;

                $progressSnapshotObj[ "num" . $currentLevel ] = $count ;
            }
        }

        $deckDetailsObj[ "progressSnapshot" ] = $progressSnapshotObj ;

        array_push( $deckDetailsObj[ "learningCurveData" ], 
                    array( $progressSnapshotObj[ "numNS"  ],
                           $progressSnapshotObj[ "numL0"  ], 
                           $progressSnapshotObj[ "numL1"  ],
                           $progressSnapshotObj[ "numL2"  ], 
                           $progressSnapshotObj[ "numL3"  ],
                           $progressSnapshotObj[ "numMAS" ] ));
    }

    private function attachDifficultyTimeAverages( &$deckDetailsObj ) {

        $diffTimeAverages = array() ;

        $tupules = $this->clsDAO->getDifficultyTimeAveragesForChapter( 
                                        ExecutionContext::getCurrentUserName(), 
                                        $this->chapterId ) ;

        for( $i=0; $i < count( $tupules ); $i++ ) {
            $cardType        = $tupules[$i][ "card_type" ] ;
            $difficultyLevel = $tupules[$i][ "difficulty_level" ] ;
            $numAttempts     = $tupules[$i][ "num_attempts" ] ;
            $avgTime         = $tupules[$i][ "avg_time" ] ;
            
            if( !array_key_exists( $cardType, $diffTimeAverages ) ) {
                $diffTimeAverages[ $cardType ] = array() ;
            }
            $values = &$diffTimeAverages[ $cardType ] ;

            array_push( $values, array( $difficultyLevel, $numAttempts, $avgTime ) ) ;
        }
        $deckDetailsObj[ "difficultyTimeAverages" ] = $diffTimeAverages ;
    }

    private function constructQuestions() {

        $questions = array() ;
        if( $this->forExercise ) {
            $cards = $this->clsDAO->getAllCardsForUser( ExecutionContext::getCurrentUserName(), 
                                                        $this->chapterId ) ;
        }
        else {
            $cards = $this->clsDAO->getCardsForUser( ExecutionContext::getCurrentUserName(), 
                                                     $this->chapterId ) ;
        }

        foreach( $cards as $card ){
            array_push( $questions, $this->constructQuestion( $card ) ) ;
        }

        return $questions ;
    }

    private function constructQuestion( $card ) {

        $quesiton = array() ;
        $learningStats = array() ;

        $question[ "questionId"      ] = $card[ "card_id" ] ;
        $question[ "section"         ] = $card[ "section" ] ;
        $question[ "questionType"    ] = $card[ "card_type" ] ;
        $question[ "difficultyLevel" ] = $card[ "difficulty_level" ] ;
        $question[ "evalVars"        ] = $this->encodeEvalVars( $card[ "eval_vars" ] ) ;
        $question[ "scriptBody"      ] = base64_encode( $card[ "script_body" ] ) ;
        $question[ "markedForReview" ] = $card[ "marked_for_review" ] ;
        $question[ "elementType"     ] = $card[ "element_type" ] ;

        $this->injectCardContent( $question, $card[ "content" ] ) ;

        $lastAttemptTime = $card[ "last_attempt_time" ] ;
        if( $lastAttemptTime == null ) {
            $lastAttemptTime = -1 ;
        }
        else {
            $lastAttemptTime = strtotime( $lastAttemptTime ) * 1000 ;
        }

        $learningStats[ "numAttempts"        ] = $card[ "num_attempts" ] ;
        $learningStats[ "learningEfficiency" ] = $card[ "learning_efficiency" ] ;
        $learningStats[ "currentLevel"       ] = $card[ "current_level" ] ;
        $learningStats[ "temporalScores"     ] = str_split( $card[ "temporal_ratings" ] ) ;
        $learningStats[ "retentionValue"     ] = $card[ "retention_value" ] ; 
        $learningStats[ "preparednessValue"  ] = $card[ "exam_preparedness_value" ] ; 
        $learningStats[ "lastAttemptTime"    ] = $lastAttemptTime ;
        $learningStats[ "totalTimeSpent"     ] = $card[ "total_time_spent" ] ;

        $question[ "learningStats" ] = $learningStats ;

        return $question ;
    }

    private function encodeEvalVars( $data ) {

        $varsArray = array() ;
        if( $data != null ) {
            $varsMap = json_decode( $data ) ;
            foreach( $varsMap as $key => $value ) {
                $varsArray[ $key ] = base64_encode( $value ) ;
            }
        }
        return $varsArray ;
    }

    private function injectCardContent( &$element, $content ) {

        $this->logger->debug( "Extracting from content " . $content ) ;
        $contentArr = json_decode( $content, true ) ;
        foreach( $contentArr as $key => $value ) {
            $element[ $key ] = $value ;
        }
    }
}

?>