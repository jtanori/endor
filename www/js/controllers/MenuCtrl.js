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
        $ionicModal,
        $ionicSlideBoxDelegate,
        $ionicHistory,
        AppConfig,
        LinksService,
        AnalyticsService,
        User
    ) {
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
                $rootScope.user.save('settings', $rootScope.settings);
            }
        });

        $rootScope.$watch('settings.mapAnimation', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $rootScope.user.save('settings', $rootScope.settings);
            }
        });

        $rootScope.$watch('settings.autoSearch', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $rootScope.user.save('settings', $rootScope.settings);
            }
        });

        $rootScope.$watch('settings.autoFocus', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $rootScope.user.save('settings', $rootScope.settings);
            }
        });

        $rootScope.$watch('settings.searchRadius', function(val, oldVal) {
            if (val !== undefined && val !== oldVal) {
                $rootScope.user.save('settings', $rootScope.settings);
            }
        });

        $scope.toggleGeolocation = function() {
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
            $rootScope.$broadcast('venue:new:frommenu');
            $scope.newBusinessStarted = true;
            $scope.closeLeft();
        };

        $scope.newBusinessStarted = false;
        $rootScope.$on('venue:new', function(){
            $scope.newBusinessStarted = true;
        });

        $rootScope.$on('venue:new:cancel', function(){
            $scope.newBusinessStarted = false;
        });

        $scope.openVideo = function(id){
            AnalyticsService.track('openSidebarVideo', {video: id});
            LinksService.openExternalApp('youtube:video', id);
        };

        $scope.openExternalApp = function(type, identifier, subIdentifier){
            AnalyticsService.track('openSidebarExternalApp', {type: '' + type, identifier: '' + identifier, subIdentifier: '' + subIdentifier});
            LinksService.openExternalApp(type, identifier, subIdentifier);
        };

        $scope.openUrl = function(url){
            AnalyticsService.track('openDrawerURL', {url: url});
            LinksService.open(url);
        };

        $scope.tutorial = function(){
            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(false);
            }

            $ionicModal.fromTemplateUrl('templates/tutorial.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $rootScope.tutorialModal = modal;
                $rootScope.tutorialModal.show();

                $rootScope.$watch('mainMap', function(){
                    if($rootScope.tutorialModal && $rootScope.tutorialModal.isShown() && $rootScope.mainMap){
                        $rootScope.mainMap.setClickable(false);
                    }
                });

                if($rootScope.mainMap){
                    $rootScope.mainMap.setClickable(false);
                }

                AnalyticsService.track('openTutorial', {});
            });
        };

        $scope.closeTutorial = function(){
            $rootScope.tutorialModal
                .remove()
                .then(function(){
                    if($rootScope.mainMap){
                        $rootScope.mainMap.setClickable(true);
                    }
                });
        }

        var _left = false;
        $scope.openLeft = function() {
            $rootScope.mainMap.setClickable(false);
            $ionicSideMenuDelegate.toggleLeft(false);
            Keyboard.hide();
            _left = true;
        };

        $scope.isLeftOpen = function(){
            return _left;
        };

        var _right = false;
        $scope.openRight = function() {
            $ionicSideMenuDelegate.toggleRight(false);
            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(false);
            }
            Keyboard.hideFormAccessoryBar(false);
            Keyboard.hide();
            _right = true;
        };

        $scope.isRightOpen = function(){
            return _right;
        }

        $scope.closeLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(true);
            }
            Keyboard.hide();
            _left = false;
        };

        $scope.closeRight = function() {
            $ionicSideMenuDelegate.toggleRight();
            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(true);
            }
            Keyboard.hideFormAccessoryBar(true);
            Keyboard.hide();
            _right = false;
        };

        $scope.logout = function() {
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();

            if ($ionicSideMenuDelegate.isOpenLeft()) {
                $ionicSideMenuDelegate.toggleLeft(true);
                _left = false;
            }

            if ($ionicSideMenuDelegate.isOpenRight()) {
                $ionicSideMenuDelegate.toggleRight(true);
                right = false;
            }

            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(false);
            }

            AnalyticsService.track('logout', {user: $rootScope.user.id});

            $rootScope.user = null;
            $rootScope.settings = null;

            User.logOut();
            $state.go('login');
        }

        $scope.helpVideos = [];

        Parse.Config
            .get()
            .then(function(c){
                $scope.helpVideos = c.get('helpVideos');
                $scope.twitter = c.get('twitterUsername');
                $scope.instagram = c.get('instagramUsername');
                $scope.fbID = c.get('facebookPageID');
                $scope.www = c.get('www');
            },function(){
                //Report error
            });

        $ionicPlatform.ready(function() {
            if (ionic.Platform.isIOS()) {
                options.presentationstyle = 'fullscreen';
                options.transitionstyle = 'fliphorizontal';
                options.toolbarposition = 'top';
                options.disallowoverscroll = 'yes';
            }

            if(!$localStorage.get('tutorial')) {
                Parse.Config
                    .get()
                    .then(function(c){
                        if(c.get('showHelpVideos')){
                            $scope.tutorial();
                            $localStorage.set('tutorial', true);
                        }
                    });
            }
        });
    });