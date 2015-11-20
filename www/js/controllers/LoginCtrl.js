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
        $timeout,
        User,
        AppConfig) {

        var _signup = false;

        $scope.user = {};
        $scope.master = {};
        //xclude FB login for ios 9 for now
        $scope.canFB = ionic.Platform.isIOS() && ionic.Platform.device().version*1 > 8.4 ? false : true;

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
            var settings = User.current().get('settings');

            //Set root user
            $rootScope.user = User.current();

            if(settings && !_.isEmpty(settings.mobile)){
                $rootScope.settings = settings.mobile;
            }else{
                settings.mobile = $rootScope.settings;
                $rootScope.user.save('settings', settings);
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
                        switch (e.code) {
                            case 101:
                                e.message = 'Usuario y contraseña invalidos';
                                break;
                        }
                        
                        $timeout(function(){
                            $cordovaProgress.hide();
                        });
                        $timeot(function(){
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
                        
                        _onLogin();
                        
                        form.$setPristine();
                        form.$setUntouched();

                        $scope.user = angular.copy($scope.master);

                        $timeout(function(){
                            $cordovaProgress.hide();
                        })
                        $state.go('app.home');
                    },
                    error: function(user, e) {
                        switch (e.code) {
                            case 202:
                                e.message = 'Ya existe un usuario con ese correo';
                                break;
                        }
                        $timeout(function(){
                            $cordovaProgress.hide();
                        });
                        $timeot(function(){
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

        $ionicPlatform.ready(function() {
            if (Parse.User.current()) {
                $state.go('app.home');
            }

            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();

            $scope.$on('$ionicView.beforeLeave', function() {
                Keyboard.disableScrollingInShrinkView(true);
                Keyboard.hideFormAccessoryBar(true);
                Keyboard.shrinkView(true);
            });

            $scope.enableLogin();
            Keyboard.shrinkView(false);
            Keyboard.disableScrollingInShrinkView(false);
            Keyboard.hideFormAccessoryBar(false);

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

                    //Login
                    Parse.FacebookUtils
                        .logIn(authData)
                        .then(function() {
                            //Set root user
                            $rootScope.user = User.current();
                            
                            _onLogin();

                            $cordovaFacebook.api("me", ["public_profile", "email", "user_friends"])
                                .then(function(data) {
                                    $rootScope.user.save({
                                            gender: data.gender || '',
                                            firstName: data.first_name,
                                            lastName: data.last_name,
                                            name: data.name,
                                            fullName: data.first_name + ' ' + data.last_name,
                                            email: data.email,
                                            avatar: 'http://graph.facebook.com/' + data.id + '/picture?type=large',
                                            facebook: true
                                        })
                                        .then(function() {
                                            $timeout(function(){
                                                $cordovaProgress.hide();
                                            });
                                            $state.go('app.home');
                                        }, function() {
                                            $timeout(function(){
                                                $cordovaProgress.hide();
                                            });
                                            $state.go('app.home');
                                        });
                                }, function(error) {
                                    $timeout(function(){
                                        $cordovaProgress.hide();
                                    });
                                    $state.go('app.home');
                                });
                        }, function(e) {
                            $timeout(function(){
                                $cordovaProgress.hide();
                            });
                            $cordovaDialogs.alert(e.message, 'Error', 'Ok');
                        });
                }
            };

            $scope.facebookLogin = function() {
                $timeout(function(){
                    $cordovaProgress.showSimpleWithLabelDetail(true, 'Conectando', 'Esperen un momento');
                });

                $cordovaFacebook.getLoginStatus()
                    .then(function(response) {
                        switch (response.status) {
                            case 'connected':
                                facebookLogin(response);
                                break;
                            default:
                                $cordovaFacebook.login(["public_profile", "email", "user_friends"])
                                    .then(facebookLogin, function(error) {
                                        $timeout(function(){
                                            $cordovaProgress.hide();
                                        });
                                        $timeout(function(){
                                            $cordovaDialogs.alert('No podemos conectar con tu cuenta de Facebook, por favor intenta de nuevo', 'Hay caramba!', 'Ok');
                                        });
                                    });
                                break;
                        }
                    }, function() {
                        $timeout(function(){
                            $cordovaProgress.hide();
                        });
                        $timeout(function(){
                            $cordovaDialogs.alert('No podemos conectar con tu cuenta de Facebook, por favor intenta de nuevo', 'Hay caramba!', 'Ok');
                        });
                    });
            };
        });
    });