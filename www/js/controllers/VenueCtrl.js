angular
	.module('jound.controllers')
	.controller('VenueCtrl', function($scope, $rootScope, $timeout, venue){
		console.log('venue controller', venue);
		$scope.venue = venue.toJSON();
		$scope.images = [];

		if($scope.venue.images && $scope.venue.images.length){
			$timeout(function(){
				$scope.$apply(function(){
					$scope.images.push(venue.getLogo());
					$scope.images = $scope.images.concat($scope.venue.images);
				});
			})
		}
	});