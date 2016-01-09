angular.module('jound.services')

.factory('AnalyticsService', function($q, $ionicPlatform, $cordovaDevice, $http, AppConfig, User){

    var global = {
        ready: function(){
            var deferred = $q.defer();

            $ionicPlatform.ready(function(){
                deferred.resolve();
            });

            return deferred.promise;
        }
    };

    $ionicPlatform.ready(function(){
        function getDeviceData(e){
            var d = {
                cordova: $cordovaDevice.getCordova(),
                model: $cordovaDevice.getModel(),
                platform: $cordovaDevice.getPlatform(),
                version: $cordovaDevice.getVersion(),
                parseVersion: Parse.VERSION,
                parseInstallation: Parse._installationId
            };

            if(_.isObject(e)){
                d = angular.extend(d, e);
            }

            return d;
        };

        global.track = function(type, e){
            var deviceData = getDeviceData(e);
            
            if(User.current()){
                deviceData.user = User.current().id;
            }

            Parse.Analytics.track(type, deviceData);

            deviceData.event = type;
            deviceData.timestamp = new Date()*1;
            //Post device data to analytics service
            $http.post(AppConfig.API_URL + 'analytics', {data: deviceData});
        };
    });
    
    return global;
});