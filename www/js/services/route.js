angular.module('jound.services')

.factory('RoutesService', function($http, AppConfig) {

    return {
        trace: function(from, to){
            return $http({
                url: AppConfig.API_URL  + 'directions/' + from + '/' + to,
                method: 'GET'
            })
        }
    };
});