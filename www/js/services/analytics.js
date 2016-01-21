angular.module('jound.services')

.factory('AnalyticsService', function($q, $ionicPlatform, $cordovaDevice, $http, AppConfig, $rootScope){

    var global = {
        ready: function(){
            var deferred = $q.defer();

            $ionicPlatform.ready(function(){
                deferred.resolve();
            });

            return deferred.promise;
        },
        track: function(){}
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
            var serverLogData = angular.extend({}, deviceData, {
                user: $rootScope.user ? $rootScope.user.id : null,
                timestamp: new Date()*1,
                event: type
            });

            //Post device data to analytics service
            $http.post(AppConfig.API_URL + 'analytics', {data: serverLogData});

            _.each(deviceData, function(a, i){
                deviceData[i] = '' + a;
            });

            Parse.Analytics.track(type, deviceData);
        };
    });

    return global;
});
