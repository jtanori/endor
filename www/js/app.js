// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('jound.controllers', []);
angular.module('jound.services', []);
angular.module('jound.directives', []);

angular.module('jound', 
  [
    'ng',
    'ionic',
    'ionic.service.core',
    'ngCordova',
    'ngSanitize',
    'ionic.service.push',
    'ionic.rating',

    'jound.controllers',
    'jound.services',
    'jound.directives'
  ]
)

.run(function($ionicPlatform, $rootScope, $cordovaSplashscreen) {
  
  $ionicPlatform.ready(function() {
    
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    $cordovaSplashscreen.hide();
    //Force portrait lock
    if(window.screen){
        window.screen.lockOrientation('portrait');
    }
  });
})

.value('AppConfig', {
    PARSE: {
        appId: "hq7NqhxfTb2p7vBij2FVjlWj2ookUMIPTmHVF9ZH",
        jsKey: "cdfm37yRroAiw82t1qukKv9rLVhlRqQpKmuVlkLC"
    },
    //API_URL: 'http://192.168.1.73:8100/api/',
    API_URL: 'http://www.jound.mx/',
    GEO: {
        DEFAULT: {enableHighAccuracy: true, maximumAge: 1000, timeout: 10000},
        DEFAULT_CENTER: {coords: {latitude: 19.432608, longitude: -99.133208}},
        DEFAULT_ZOOM: 6,
        DEFAULT_WATCH_OPTIONS: {
            frequency : 60000,
            timeout : 10000,
            enableHighAccuracy: false,
            maximumAge: 1000
        }
    },
    RADIUS: {
        DEFAULT: {
            'radius': 3000,
            'strokeColor' : 'rgba(0,0,255,0.1)',
            'strokeWidth': 1,
            'fillColor' : 'rgba(0,0,255,0.07)',
            'visible': false
        }
    },
    SETTINGS: {
        autoSearch: false,
        autoFocus: true,
        mapAnimation: true,
        searchRadius: 3000,//meters
        center: null,
        usingGeolocation: true,
        position: null
    },/*,
    CAMERA: {
        PHOTO_CAPTURE_DEFAULT: {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 600,
            targetHeight: 600,
            //popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            meditaType: Camera.MediaType.PICTURE,
            correctOrientation: true
        },
        PHOTO_CAPTURE_ROLL: {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
            allowEdit : true,
            targetWidth: 600,
            targetHeight: 600,
            meditaType: Camera.MediaType.PICTURE,
            correctOrientation: true
        }
    },*/
    QUERY: {
        VENUE_DEFAULT_FIELDS: [
            'name',
            'activity_description',
            'block',
            'building', 
            'building_floor', 
            'claimed_by',
            'exterior_letter', 
            'email_address', 
            'exterior_number', 
            'federal_entity', 
            'internal_letter', 
            'internal_number', 
            'keywords', 
            'locality', 
            'municipality', 
            'phone_number', 
            'position', 
            'postal_code', 
            'rating',
            'road_name', 
            'road_name_1', 
            'road_name_2', 
            'road_name_3', 
            'road_type', 
            'road_type_1', 
            'road_type_2', 
            'road_type_3', 
            'settling_name', 
            'settling_type', 
            'shopping_center_name', 
            'shopping_center_store_number', 
            'shopping_center_type', 
            'www', 
            'logo', 
            'avatar', 
            'page',
            'images'
        ]
    },
    DATE: {
        DAY: [
            'Domingo',
            'Lunes',
            'Martes',
            'Miercoles',
            'Jueves',
            'Viernes',
            'Sabado'
        ]
    },
    ADMOB: {
        DEFAULT_OPTIONS: {
            bannerId: 'ca-app-pub-9450508564392305/7289295079',
            interstitialId: 'ca-app-pub-9450508564392305/8766028274',
            adSize: 'SMART_BANNER',
            //position: AdMob.AD_POSITION.BOTTOM_CENTER,
            isTesting: true,
            autoShow: false
        }
    },
    GOOGLE: {
        MAPS_WEB_KEY: 'AIzaSyDzZII1NdMzWZaRPfTFntVwaGt6p5hnesQ'
    },
    MARKERS: {
        LOCATION: {
            url: 'www/img/marker_location.png',
            size: {
                width: 20,
                height: 20
            }
        },
        LOCATION_CUSTOM: {
            url: 'www/img/marker_location_custom.png',
            size: {
                width: 20,
                height: 20
            }
        },
        LOCATION_CUSTOM_PIN: {
            url: 'www/img/marker_location_custom_pin.png',
            size: {
                width: 32.5,
                height: 35
            }
        },
        VENUE: {
            url: 'www/img/marker_venue.png',
            size: {
                width: 30,
                height: 43
            }
        },
        VENUE_SELECTED: {
            url: 'www/img/marker_venue_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        A: {
            url: 'www/img/marker_a.png',
            size: {
                width: 30,
                height: 43
            }
        },
        A_SELECTED: {
            url: 'www/img/marker_a_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        B: {
            url: 'www/img/marker_b.png',
            size: {
                width: 30,
                height: 43
            }
        },
        B_SELECTED: {
            url: 'www/img/marker_b_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        C: {
            url: 'www/img/marker_c.png',
            size: {
                width: 30,
                height: 43
            }
        },
        C_SELECTED: {
            url: 'www/img/marker_c_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        D: {
            url: 'www/img/marker_d.png',
            size: {
                width: 30,
                height: 43
            }
        },
        D_SELECTED: {
            url: 'www/img/marker_d_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        E: {
            url: 'www/img/marker_e.png',
            size: {
                width: 30,
                height: 43
            }
        },
        E_SELECTED: {
            url: 'www/img/marker_e_selected.png',
            size: {
                width: 30,
                height: 43
            }
        }
    },
    ROUTES: {
        A: {
            'color' : '#387ef5',
            'width': 10
        },
        B: {
            'color' : '#ef473a',
            'width': 10
        },
        C: {
            'color' : '#444',
            'width': 10
        }
    },
    MAP: {
        DEFAULT: {
            'backgroundColor': 'white',
            'mapType': 'MAP_TYPE_NORMAL',
            'controls': {
                'compass': true,
                'myLocationButton': false,
                'indoorPicker': true,
                'zoom': true
            },
            'gestures': {
                'scroll': true,
                'tilt': true,
                'rotate': true
            },
            'camera': {
                'zoom': 10
            }
        }
    }
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {


    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html",
            controller: 'MenuCtrl'
        })

        .state('app.home', {
            url: "/venues",
            views: {
                'app': {
                    templateUrl: "templates/home.html",
                    controller: 'HomeCtrl'
                }
            }
        })

        .state('app.venue', {
            url: "/venues/:venueId",
            views: {
                'app': {
                    templateUrl: "templates/venue.html",
                    controller: 'VenueCtrl'
                }
            },
            resolve: {
                venue: function($stateParams, VenuesService) {
                    return VenuesService.getById($stateParams.venueId)
                }
            },
            defaultBack: {
                state: 'app.home'
            }
        })

        .state('app.venueAbout', {
            url: "venues/:venueId/about",
            views: {
                'app': {
                    templateUrl: "templates/venue/about.html",
                    controller: 'VenueAboutCtrl'
                }
            },
            resolve: {
                venue: function($stateParams, VenuesService) {
                    return VenuesService.getById($stateParams.venueId)
                }
            },
            defaultBack: {
                state: 'app.venue',
                getStateParams: function(stateParams) {
                    return {
                        postId: stateParams.venueId
                    };
                }
            }
        })

        .state('app.venuePromos', {
            url: "venues/:venueId/promos",
            views: {
                'app': {
                    templateUrl: "templates/venue/promos.html",
                    controller: 'VenuePromosCtrl'
                }
            },
            resolve: {
                venue: function($stateParams, VenuesService) {
                    return VenuesService.getById($stateParams.venueId)
                }
            },
            defaultBack: {
                state: 'app.venue',
                getStateParams: function(stateParams) {
                    return {
                        postId: stateParams.venueId
                    };
                }
            }
        })

        .state('app.venueProducts', {
            url: "venues/:venueId/products",
            views: {
                'app': {
                    templateUrl: "templates/venue/products.html",
                    controller: 'VenueProductsCtrl'
                }
            },
            resolve: {
                venue: function($stateParams, VenuesService) {
                    return VenuesService.getById($stateParams.venueId)
                }
            },
            defaultBack: {
                state: 'app.venue',
                getStateParams: function(stateParams) {
                    return {
                        postId: stateParams.venueId
                    };
                }
            }
        })

        .state('app.venueReviews', {
            url: "venues/:venueId/reviews",
            views: {
                'app': {
                    templateUrl: "templates/venue/reviews.html",
                    controller: 'VenueReviewsCtrl'
                }
            },
            resolve: {
                venue: function($stateParams, VenuesService) {
                    return VenuesService.getById($stateParams.venueId)
                }
            },
            defaultBack: {
                state: 'app.venue',
                getStateParams: function(stateParams) {
                    return {
                        postId: stateParams.venueId
                    };
                }
            }
        })

        .state('app.search', {
            url: "/venues/search/:categoryId/:lat/:lng",
            abstract: true,
            views: {
                'app': {
                    controller: 'HomeCtrl'
                }
            }
        })

        .state('signup', {
            url: '/signup',
            templateUrl: 'templates/signup.html',
            controller: 'SignupCtrl'
        })

        .state('login', {
            url: "/login",
            templateUrl: "templates/login.html",
            controller: 'LoginCtrl'
        })

        .state('forgot', {
            url: "/forgot-password",
            templateUrl: "templates/forgot-password.html",
            controller: 'ForgotPasswordCtrl'
        })

        .state('start', {
            url: '/start',
            templateUrl: 'templates/start.html',
            controller: 'StartCtrl'
        })

    // if none of the above states are matched, use this as the fallback
    //TODO: Load loading controller first to avoid displaying login screen in android
    $urlRouterProvider.otherwise('/start');

    $ionicConfigProvider.tabs.position('bottom');

})
.factory('User', function($q, $http, AppConfig){
    return Parse.User.extend({
        checkUserCheckIn: function(id){
            var deferred = $q.defer();

            if(!id){
                deferred.reject('No venue id provided for checkin');
            }else {
                $http
                    .post(AppConfig.API_URL + 'checkUserCheckIn', {id: id, userId: this.id})
                    .then(function(response){
                        deferred.resolve(response.data.results || []);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        checkIn: function(id){
            var deferred = $q.defer();

            if(!id){
                deferred.reject('No venue id provided for checkin');
            }else {
                $http
                    .post(AppConfig.API_URL + 'checkIn', {id: id, userId: this.id})
                    .then(function(response){
                        console.log('checking', response);
                        deferred.resolve(response);
                    }, function(response){
                        console.log('checkin error', response);
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        getDisplayName: function(){
            var name = this.escape('name') ? this.escape('name') : this.escape('username') ? this.escape('username') : 'Joundini';

            return name;
        },
        getAvatar: function(){
            var a = this.get('avatar');

            if(Parse._.isString(a)){
                return a;
            }else if(this.get('avatar') && this.get('avatar').get('file')){
                return this.get('avatar').get('file').url();
            }else{
                return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(this.get('username'));
            }
        },
        getBasicData: function(){
            return {
                id: this.id,
                username: this.get('username'),
                email: this.get('email'),
                displayName: this.getDisplayName(),
                settings: this.get('settings'),
                avatar: this.getAvatar(),
                name: this.get('name'),
                lastName: this.get('lastName'),
                facebook: this.get('facebook')
            };
        }
    });
})
.factory('$localStorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}])
.run(function($rootScope, User, $localStorage, $state, AppConfig){
    //Initialize Parse
    Parse.initialize(AppConfig.PARSE.appId, AppConfig.PARSE.jsKey);
    //Get user
    var u = User.current();
    //Set user in root
    $rootScope.user = null;
    $rootScope.settings = null;
    //Load settings
    if(u){
        $rootScope.user = u;
        $rootScope.settings = u.get('settings') ? u.get('settings').mobile : AppConfig.SETTINGS;

        if($localStorage.getObject('settings')){
            $rootScope.settings = angular.extend($rootScope.settings, $localStorage.getObject('settings'));
        }
    }
})
.controller('StartCtrl', function($state, $rootScope, User){
    //Redirect to proper page
    if(!!$rootScope.user){
        $state.go('app.home');
    }else{
        $state.go('login');
    }
});
