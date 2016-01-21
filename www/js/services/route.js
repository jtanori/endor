angular.module('jound.services')

.factory('RoutesService', function($http, AppConfig, EARTHRADIUS) {

    var rad = function(x) {
        return x * Math.PI / 180;
    };

    return {
        trace: function(from, to, mode){
        	var url = AppConfig.API_URL  + 'directions/' + from + '/' + to;

        	switch(mode){
        	case 'walking': url = AppConfig.API_URL  + 'directions/' + from + '/' + to + '/' + mode;
        	}

            return $http({
                url: url,
                method: 'GET'
            })
        },
        //Calculates distance between two points
        distance: function(p1, p2){
            var dLat = rad(p2.latitude - p1.latitude);
            var dLong = rad(p2.longitude - p1.longitude);
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude)) *
                    Math.sin(dLong / 2) * Math.sin(dLong / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = EARTHRADIUS * c;

            return d; // returns the distance in meter
        }
    };
});
