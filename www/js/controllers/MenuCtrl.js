angular
    .module('jound.controllers')
    .controller('MenuCtrl', function(
        $scope,
        $rootScope,
        $state,
        $cordovaInAppBrowser,
        $cordovaKeyboard,
        $ionicPlatform,
        $ionicSideMenuDelegate,
        $timeout,
        $localStorage,
        $ionicModal,
        $ionicHistory,
        AppConfig,
        LinksService,
        AnalyticsService,
        User,
        AnonymousUser
    ) {
        $scope.usingGeolocation = $rootScope.settings.usingGeolocation;
        $scope.helpVideos = [];
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
            AnalyticsService.track('openSidebarExternalApp', {type:  type, identifier:  identifier, subIdentifier:  subIdentifier});
            LinksService.openExternalApp(type, identifier, subIdentifier);
        };

        $scope.openUrl = function(url){
            AnalyticsService.track('openDrawerURL', {url: url});
            LinksService.open(url);
        };

        var _left = false;
        $scope.openLeft = function() {
            $rootScope.mainMap.setClickable(false);
            $ionicSideMenuDelegate.toggleLeft(false);
            $cordovaKeyboard.close();
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
            $cordovaKeyboard.hideAccessoryBar(false);
            $cordovaKeyboard.close();
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
            $cordovaKeyboard.close();
            _left = false;
        };

        $scope.closeRight = function() {
            $ionicSideMenuDelegate.toggleRight();
            if($rootScope.mainMap){
                $rootScope.mainMap.setClickable(true);
            }
            $cordovaKeyboard.hideAccessoryBar(true);
            $cordovaKeyboard.close();
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

            if(User.current()){
                User.logOut();
            }else {
                AnonymousUser.logOut();
            }

            $state.go('login');
        }

        $scope.signup = function(){
            $scope.closeLeft();
            $state.go('login');
        };

        Parse.Config
            .get()
            .then(function(c){
                $scope.helpVideos = c.get('helpVideos');
                $scope.twitter = c.get('twitterUsername');
                $scope.instagram = c.get('instagramUsername');
                $scope.fbID = c.get('facebookPageID');
                $scope.www = c.get('www');
            });

        $ionicPlatform.ready(function() {
            if (ionic.Platform.isIOS()) {
                options.presentationstyle = 'fullscreen';
                options.transitionstyle = 'fliphorizontal';
                options.toolbarposition = 'top';
                options.disallowoverscroll = 'yes';
            }
        });
    })
    .controller('TutorialCtrl', function($scope, $timeout, $rootScope, $ionicSlideBoxDelegate, $ionicHistory, $localStorage, $state, TUTORIAL){
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();

        $scope.tutorialItems = TUTORIAL;

        $scope.closeTutorial = function(){
            $localStorage.set('tutorial', true);
            $state.go('app.home');
        }

        $scope.next = function() {
            $ionicSlideBoxDelegate.$getByHandle('tutorialSlideboxHandle').next();
        };

        $scope.previous = function() {
            $ionicSlideBoxDelegate.$getByHandle('tutorialSlideboxHandle').previous();
        };

        $scope.slideTo = function(index){
            $ionicSlideBoxDelegate.$getByHandle('tutorialSlideboxHandle').slide(index);
        }

        $scope.canPrev = function(){
            return $ionicSlideBoxDelegate.$getByHandle('tutorialSlideboxHandle').currentIndex()
        }

        $scope.canNext = function(){
            var index = $ionicSlideBoxDelegate.$getByHandle('tutorialSlideboxHandle').currentIndex();

            return index < $scope.tutorialItems.length-1;
        }
    });
