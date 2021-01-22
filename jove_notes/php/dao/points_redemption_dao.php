<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class PointsRedemptionDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

  function getRedemptionCatalog( $userName ) {

$query = <<< QUERY
SELECT 
    rc.item_name,
    rc.points_per_item,
    rc.multiple_units_allowed,
    rc.num_redemptions_per_day,
    sum( pr.redemption_qty ) as total_redeemed_qty_today,
    sum( pr.points ) as total_points_redeemed_today
FROM 
    jove_notes.redemption_catalog rc 
LEFT OUTER JOIN jove_notes.points_redemption pr ON
    rc.item_name = pr.redemption_item AND
    pr.redemption_time > CURDATE()
WHERE
    pr.student_name = "$userName" or 
    pr.student_name IS NULL
GROUP BY
    rc.item_name, 
    rc.points_per_item,
    rc.multiple_units_allowed,
    rc.num_redemptions_per_day
QUERY;

        $colNames = [ "item_name", 
                      "points_per_item", 
                      "multiple_units_allowed", 
                      "num_redemptions_per_day",
                      "total_redeemed_qty_today",
                      "total_points_redeemed_today" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }

    function saveRedemption( $userName, $points, $itemName, $numUnits ) {

$query = <<< QUERY
insert into jove_notes.points_redemption
( 
  student_name, 
  points, 
  redemption_item, 
  redemption_qty, 
  redemption_time
)
values
( 
  '$userName', 
  $points,
  '$itemName',
  $numUnits,
  NOW()
)
QUERY;

      return parent::executeInsert( $query ) ;
    }
}
?>

