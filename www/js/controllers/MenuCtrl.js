angular
    .module('jound.controllers')
    .controller('MenuCtrl', function(
        $scope,
        $rootScope,
        $state,
        $cordovaInAppBrowser,
        $ionicPlatform,
        $ionicSideMenuDelegate,
        $timeout,
        $localStorage,
        $cordovaKeyboard,
        User
    ) {
        $scope.right = false;
        $scope.left = false;
        $scope.usingGeolocation = $rootScope.settings.usingGeolocation;

        $ionicSideMenuDelegate.canDragContent(false);

        var options = {
            location: 'no',
            clearcache: 'yes',
            toolbar: 'yes'
        };

        function updateGeolocationButton(val) {
            $timeout(function() {
                $scope.$apply(function() {
                    $scope.usingGeolocation = val;
                });
            });
        };

        $scope.$on('change:usingGeolocation', function(e, val) {
            updateGeolocationButton(val);
        });

        $rootScope.$watch('settings.usingGeolocation', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                updateGeolocationButton(val);
                $localStorage.setObject('settings', $rootScope.settings);
                
                var settings = $rootScope.user.get('settings');

                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
            }
        });

        $rootScope.$watch('settings.mapAnimation', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $localStorage.setObject('settings', $rootScope.settings);
                
                var settings = $rootScope.user.get('settings');

                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
            }
        });

        $rootScope.$watch('settings.autoSearch', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $localStorage.setObject('settings', $rootScope.settings);
                
                var settings = $rootScope.user.get('settings');

                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
            }
        });

        $rootScope.$watch('settings.autoFocus', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $localStorage.setObject('settings', $rootScope.settings);

                var settings = $rootScope.user.get('settings');

                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
            }
        });

        $rootScope.$watch('settings.searchRadius', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $localStorage.setObject('settings', $rootScope.settings);
                
                var settings = $rootScope.user.get('settings');

                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
            }
        });

        $scope.toggleGeolocation = function(on) {
            $rootScope.settings.usingGeolocation = !$rootScope.settings.usingGeolocation;
        };

        $scope.home = function(){
            $scope.closeLeft();
            $state.go('app.home');
        };

        $scope.about = function() {
            $cordovaInAppBrowser.open('http://app.jound.mx/acerca-de-jound.html', '_blank', options);
        };

        $scope.privacy = function() {
            $cordovaInAppBrowser.open('http://www.jound.mx/privacy', '_blank', options);
        };

        $scope.help = function() {
            $cordovaInAppBrowser.open('http://www.jound.mx/ayuda', '_blank', options);
        };

        $scope.business = function(){
            //console.log('add new business');
        };

        var _tutorialModal;
        $scope.tutorial = function(){
            if(!_tutorialModal){
                $ionicModal.fromTemplateUrl('templates/tutorial.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    _tutorialModal = modal;
                });
            }else{
                _tutorialModal.show();
            }
        };

        $scope.openLeft = function() {
            $ionicSideMenuDelegate.toggleLeft(false);
            $scope.left = true;
            $rootScope.mainMap.setClickable(false);
        };

        $scope.openRight = function() {
            $ionicSideMenuDelegate.toggleRight(false);
            $scope.right = true;
            $rootScope.mainMap.setClickable(false);
            $cordovaKeyboard.hideAccessoryBar(false);
        };

        $scope.closeLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
            $scope.left = false;
            $rootScope.mainMap.setClickable(true);
        };

        $scope.closeRight = function() {
            $ionicSideMenuDelegate.toggleRight();
            $scope.right = false;
            $rootScope.mainMap.setClickable(true);
            $cordovaKeyboard.hideAccessoryBar(true);
        };

        $scope.logout = function() {
            if ($ionicSideMenuDelegate.isOpenLeft()) {
                $ionicSideMenuDelegate.toggleLeft(true);
                $scope.left = false;
            }

            if ($ionicSideMenuDelegate.isOpenRight()) {
                $ionicSideMenuDelegate.toggleRight(true);
                $scope.right = false;
            }

            $rootScope.mainMap.setClickable(true);

            $rootScope.user = null;
            $rootScope.settings = null;

            User.logOut();
            $state.go('login');
        }

        $ionicPlatform.ready(function() {
            if (ionic.Platform.isIOS()) {
                options.presentationstyle = 'fullscreen';
                options.transitionstyle = 'fliphorizontal';
                options.toolbarposition = 'top';
                options.disallowoverscroll = 'yes';
            }
        });
    });