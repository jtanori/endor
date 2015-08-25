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
        User,
        AppConfig) {
        $ionicPlatform.ready(function() {
            if (Parse.User.current()) {
                $state.go('app.home');
            }

            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();

            $scope.user = {};

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
                            $rootScope.settings = angular.extend($rootScope.user.get('settings') || {}, AppConfig.SETTINGS, $localStorage.getObject('settings'));

                            $localStorage.setObject('settings', $rootScope.settings);
                            $rootScope.user.save('settings', {
                                mobile: $rootScope.settings
                            });

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
                                            $cordovaProgress.hide();
                                            $state.go('app.home');
                                        }, function() {
                                            $cordovaProgress.hide();
                                            $state.go('app.home');
                                        });
                                }, function(error) {
                                    $cordovaProgress.hide();
                                    $state.go('app.home');
                                });
                        }, function(e) {
                            $cordovaProgress.hide();
                            $cordovaDialogs.alert(e.message, 'Error', 'Ok');
                        });
                }
            };

            $scope.facebookLogin = function() {
                $cordovaProgress.showSimpleWithLabelDetail(true, 'Conectando', 'Esperen un momento');
                $cordovaFacebook.getLoginStatus()
                    .then(function(response) {
                        switch (response.status) {
                            case 'connected':
                                facebookLogin(response);
                                break;
                            default:
                                $cordovaFacebook.login(["public_profile", "email", "user_friends"])
                                    .then(facebookLogin, function(error) {
                                        $cordovaProgress.hide();
                                        $cordovaDialogs.alert('No podemos conectar con tu cuenta de Facebook, por favor intenta de nuevo', 'Hay caramba!', 'Ok');
                                    });
                                break;
                        }
                    }, function() {
                        console.log('error', arguments);
                    });
            };

            $scope.login = function(form) {
                if (!form.$invalid) {
                    $cordovaProgress.showSimpleWithLabelDetail(true, 'Autenticando', 'Espere un momento');

                    User
                        .logIn($scope.user.username, $scope.user.password)
                        .then(function() {
                            //Set root user
                            $rootScope.user = User.current();
                            $rootScope.settings = angular.extend($rootScope.user.get('settings') || {}, AppConfig.SETTINGS, $localStorage.getObject('settings'));

                            $localStorage.setObject('settings', $rootScope.settings);
                            $rootScope.user.save('settings', {
                                mobile: $rootScope.settings
                            });

                            $cordovaProgress.hide();
                            $state.go('app.home');
                        }, function(e) {
                            switch (e.code) {
                                case 101:
                                    e.message = 'Usuario y contrasena invalidos';
                                    break;
                            }
                            $cordovaProgress.hide();
                            $cordovaDialogs.alert(e.message, 'Hay caramba!', 'Ok');
                        });
                }
            }
        });
    });