angular.module('jound.services')

.factory('RoutesService', function($http, AppConfig) {

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
        }
    };
});