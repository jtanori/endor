angular
    .module('jound.controllers')
    .controller('LoginCtrl', function(
        $scope,
        $rootScope,
        $state,
        $ionicPlatform,
        $cordovaFacebook,
        $cordovaProgress,
        $cordovaDialogs,
        $ionicHistory,
        $localStorage,
        $cordovaSplashscreen,
        $timeout,
        User,
        AnonymousUser,
        AppConfig,
        AnalyticsService) {

        if ($rootScope.user && !$rootScope.user.isAnonimous()) {
            $state.go('app.home');
            return;
        }

        var _signup = false;

        $scope.user = {};
        $scope.master = {};

        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();

        $ionicHistory.nextViewOptions({
            disableBack: true,
            historyRoot: true
        });

        $scope.isSignup = function(){
            return _signup;
        };

        $scope.enableLogin = function(){
            $timeout(function(){
                $scope.$apply(function(){
                    _signup = false;
                    $scope.label = 'Entrar';
                });
            });
        };

        $scope.enableSignup = function(){
            $timeout(function(){
                $scope.$apply(function(){
                    _signup = true;
                    $scope.label = 'Crear Cuenta';
                });
            });
        };

        var _onLogin = function(){
            //Set root user
            $rootScope.user = User.current();

            if(!_.isEmpty($rootScope.user) && !_.isEmpty($rootScope.user.get('settings'))){
                $rootScope.settings = $rootScope.user.get('settings');
            }else{
                $rootScope.settings = AppConfig.SETTINGS;
                $rootScope.user.save('settings', $rootScope.settings);
            }

            AnalyticsService.track('login', {user: $rootScope.user.id});

            $scope.enableLogin();

            if(AnonymousUser.exists()){
                AnonymousUser.logOut();
            }
        }

        $scope.login = function(form) {
            if (!form.$invalid) {
                $timeout(function(){
                    $cordovaProgress.showSimpleWithLabelDetail(true, 'Autenticando', 'Espere un momento');
                });

                User
                    .logIn($scope.user.username, $scope.user.password)
                    .then(function() {

                        _onLogin();

                        form.$setPristine();
                        form.$setUntouched();

                        $scope.user = angular.copy($scope.master);

                        $timeout(function(){
                            $cordovaProgress.hide();
                        });

                        $state.go('app.home');
                    }, function(e) {
                        AnalyticsService.track('error', {code:  e.code, message: e.message});

                        switch (e.code) {
                            case 101:
                                e.message = 'Usuario y contraseña invalidos';
                                break;
                        }

                        $timeout(function(){
                            $cordovaProgress.hide();
                        });
                        $timeout(function(){
                            $cordovaDialogs.alert(e.message, 'Hay caramba!', 'Ok');
                        });
                    });
            }
        }

        $scope.signup = function(form){
            if (!form.$invalid && !$scope.checkForm(form)) {

                var user = new User();

                $timeout(function(){
                    $cordovaProgress.showSimpleWithLabelDetail(true, 'Creando Cuenta', 'Espere un momento');
                });

                user.set('username', $scope.user.username);
                user.set('email', $scope.user.username);
                user.set('password', $scope.user.password);

                user.signUp(null, {
                    success: function() {
                        AnalyticsService.track('signup', {user: User.current().id});

                        _onLogin();

                        form.$setPristine();
                        form.$setUntouched();

                        $scope.user = angular.copy($scope.master);

                        $timeout(function(){
                            $cordovaProgress.hide();
                        });

                        $state.go('app.home');
                    },
                    error: function(user, e) {
                        AnalyticsService.track('error', {code:  e.code, message: e.message});

                        switch (e.code) {
                            case 202:
                                e.message = 'Ya existe un usuario con ese correo';
                                break;
                        }
                        $timeout(function(){
                            $cordovaProgress.hide();
                        });
                        $timeout(function(){
                            $cordovaDialogs.alert(e.message, 'Hay caramba!', 'Ok');
                        });
                    }
                });
            }
        }

        $scope.checkForm = function(form){
            var isEqual = ($scope.user.password === $scope.user.passwordConfirmation);

            return !(form.$valid && isEqual);
        };

        $scope.skip = function(){
            $rootScope.user = AnonymousUser.current();
            $rootScope.settings = AnonymousUser.current().get('settings');

            goHome();
        };

        function goHome(){
            $cordovaSplashscreen.show();

            if($localStorage.get('tutorial')){
                $state.go('app.home');
            }else{
                $state.go('app.tutorial');
            }
        }

        $ionicPlatform.ready(function() {
            $scope.enableLogin();

            function facebookLogin(response) {
                if (!response.authResponse) {
                    $cordovaDialogs.alert('Ha ocurrido un problema al intentar comunicarnos con Facebook, por favor intenta de nuevo.', 'Disculpa', 'Ok');
                } else {
                    var expDate = new Date(
                        new Date().getTime() + response.authResponse.expiresIn * 1000
                    ).toISOString();

                    var authData = {
                        id: String(response.authResponse.userID),
                        access_token: response.authResponse.accessToken,
                        expiration_date: expDate
                    };

                    $timeout(function(){
                        $cordovaProgress.showSimpleWithLabelDetail(true, 'Conectando', 'Esperen un momento');
                    });

                    //Login
                    Parse.FacebookUtils
                        .logIn(authData)
                        .then(function() {
                            $cordovaFacebook.api("me", ["public_profile", "email", "user_friends"])
                                .then(function(data) {
                                    _onLogin();

                                    User.current().save({
                                            gender: data.gender || '',
                                            firstName: data.first_name,
                                            lastName: data.last_name,
                                            name: data.name,
                                            fullName: data.first_name + ' ' + data.last_name,
                                            //email: data.email,
                                            avatar: 'http://graph.facebook.com/' + data.id + '/picture?type=large',
                                            facebook: true
                                        })
                                        .then(function() {
                                            $timeout(function(){
                                                $cordovaProgress.hide();
                                            });

                                            goHome();
                                        }, function(e) {
                                            AnalyticsService.track('error', {code:  e.code, message: e.message, user: $rootScope.user.id});

                                            $timeout(function(){
                                                $cordovaProgress.hide();
                                            });

                                            goHome();
                                        });
                                }, function(e) {
                                    AnalyticsService.track('error', {code:  e.code, message: e.message});

                                    $timeout(function(){
                                        $cordovaProgress.hide();
                                    });

                                    goHome();
                                });
                        }, function(e) {
                            AnalyticsService.track('error', {code:  e.code, message: e.message});

                            $timeout(function(){
                                $cordovaProgress.hide();
                            });

                            $cordovaDialogs.alert(e.message, 'Error', 'Ok');
                        });
                }
            };

            $scope.facebookLogin = function() {
                $cordovaFacebook.getLoginStatus()
                    .then(function(response) {
                        switch (response.status) {
                            case 'connected':
                                facebookLogin(response);
                                break;
                            default:
                                $cordovaFacebook.login(AppConfig.FB.DEFAULT_PERMISSIONS)
                                    .then(facebookLogin, function(e) {
                                        AnalyticsService.track('error', {code:  e.code, message: e.message});

                                        $timeout(function(){
                                            $cordovaDialogs.alert('No podemos conectar con tu cuenta de Facebook, por favor intenta de nuevo', 'Hay caramba!', 'Ok');
                                        });
                                    });
                                break;
                        }
                    }, function(e) {
                        AnalyticsService.track('error', {code:  e.code, message: e.message});

                        $timeout(function(){
                            $cordovaDialogs.alert('No podemos conectar con tu cuenta de Facebook, por favor intenta de nuevo', 'Hay caramba!', 'Ok');
                        });
                    });
            };
        });
    });
