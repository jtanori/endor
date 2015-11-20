angular.module('jound.services')

.factory('CameraService', function($q, $cordovaCamera, $ionicPlatform,$cordovaActionSheet, BASE_64){

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
        var options = {
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 600,
            targetHeight: 600,
            saveToPhotoAlbum: true,
            correctOrientation: true
        };

        var getPicture = function(options){
            var deferred = $q.defer();

            $cordovaCamera
                .getPicture(options)
                .then(function(imageData) {
                    deferred.resolve(BASE_64.JPG + imageData);
                }, function(err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        };

        global.take = function(){
            var deferred = $q.defer();
            var o = angular.copy(options);

            if(ionic.Platform.isAndroid()){
                getPicture(options)
                    .then(function(data){
                        deferred.resolve(data);
                    }, function(e){
                        deferred.reject(e);
                    });
            }else{
                $cordovaActionSheet.show({
                    title: 'Agregar una foto',
                    buttonLabels: ['Desde el carrete', 'Desde la camara'],
                    addCancelButtonWithLabel: 'Cancelar',
                    androidEnableCancelButton: true,
                    winphoneEnableCancelButton: true
                })
                    .then(function(btnIndex) {
                        console.log(btnIndex);
                        switch(btnIndex){
                        case 2:
                            o.sourceType = Camera.PictureSourceType.CAMERA;
                            break;
                        case 3:
                            return;
                        }

                        getPicture(options)
                            .then(function(data){
                                deferred.resolve(data);
                            }, function(e){
                                deferred.reject(e);
                            });
                    });
            }

            return deferred.promise;
        }
    });
    
    return global;
});