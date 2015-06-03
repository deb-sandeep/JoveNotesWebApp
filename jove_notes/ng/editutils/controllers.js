var editUtilsApp = angular.module( 'editUtilsApp', [] ) ;

editUtilsApp.controller( 'EditUtilsController', function( $scope ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.alerts    = [] ;

$scope.latex = {
	expression        : '',
	expressionType    : 'Latex',
	expressionForCopy : '',
	editorExpanded    : false 
}

$scope.hindi = {
	editorExpanded    : true,
	text              : '',
	textElements      : []
}

// ---------------- Main logic for the controller ------------------------------
log.debug( "Starting the EditUtilsController" ) ;

$scope.$watch( 'latex.expression', function( newValue, oldValue ){
	$scope.latex.expressionForCopy = $scope.latex.expression.replace( /\\/g, "\\\\" ) ;
}) ; 

// ---------------- Controller methods -----------------------------------------
$scope.addErrorAlert = function( msgString ) {
	$scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
	$scope.alerts.splice(index, 1);
};

$scope.copyLatexTextToClipboard = function() {
	window.prompt( "Copy to clipboard: Ctrl+C, Enter", $scope.latex.expressionForCopy ) ;
}

$scope.toggleLatexEditorVisibility = function() {
	$scope.latex.editorExpanded = !$scope.latex.editorExpanded ;
}

$scope.toggleHindiEditorVisibility = function() {
	$scope.hindi.editorExpanded = !$scope.hindi.editorExpanded ;
}

$scope.addHindiText = function() {

	if( $scope.hindi.text.length > 0 ) {
		$scope.hindi.textElements.push( $scope.hindi.text ) ;
		$scope.hindi.text = '' ;
	}
}

$scope.removeHindiTextElement = function( index ) {
	$scope.hindi.textElements.splice(index, 1);
}

// ---------------- Private functions ------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;



