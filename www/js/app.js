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
    'ngIOS9UIWebViewPatch',
    'ngImgCrop',

    'jound.controllers',
    'jound.services',
    'jound.directives'
  ]
)

.run(function($ionicPlatform, $rootScope, $cordovaSplashscreen) {
  
  $ionicPlatform.ready(function() {
    
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.Keyboard) {
      Keyboard.disableScrollingInShrinkView(true);
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

.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

.constant('USER_ROLES', {
  admin: 'admin_role',
  public: 'public_role'
})

.constant('VENUE_DEFAULT_IMAGE', {
    small: 'img/venue_default.jpg',
    large: 'img/venue_default_large.jpg'
})

.constant('NEW_VENUE_MASTER', {
    image: '',
    name: '',
    phone: '',
    owner: false
})

.constant('BASE_64', {
    JPG: "data:image/jpeg;base64,",
    PNG: "data:image/png;base64,"
})

.constant('VERIFICATION_LEVELS', {
    'DEFAULT': undefined,
    'VERIFIED': 1,
    'NON_VERIFIED': 2,
    'CONFLICTING': 3 
})

.constant('WEEKDAYS', {
    0: {name: 'Lunes', capital: 'L'},
    1: {name: 'Master', capital: 'M'},
    2: {name: 'Miercoles', capital: 'Mi'},
    3: {name: 'Jueves', capital: 'J'},
    4: {name: 'Viernes', capital: 'V'},
    5: {name: 'Sabado', capital: 'S'},
    6: {name: 'Domingo', capital: 'D'}
})

.constant('EARTHRADIUS', 6378137)

.constant('AppConfig', {
    PARSE: {
        appId: "hq7NqhxfTb2p7vBij2FVjlWj2ookUMIPTmHVF9ZH",
        jsKey: "cdfm37yRroAiw82t1qukKv9rLVhlRqQpKmuVlkLC"
    },
    FB: {
        DEFAULT_PERMISSIONS: ["public_profile", "email", "user_friends"]
    },
    //API_URL: 'http://192.168.1.64:8100/api/',
    HOST_URL: 'http://www.jound.mx/',
    API_URL: 'http://www.jound.mx/',
    GEO: {
        DEFAULT: {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        },
        DEFAULT_CENTER: {
            coords: {
                latitude: 19.432608,
                longitude: -99.133208
            }
        },
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
        searchRadius: 1000,//meters
        center: null,
        usingGeolocation: true,
        position: null
    },
    CAMERA: {/*
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
        }*/
    },
    QUERY: {
        VENUE_DEFAULT_FIELDS: [
            'avatar',
            'activity_description',
            'block',
            'building', 
            'building_floor', 
            'claimed_by',
            'cover',
            'cover_video',
            'exterior_letter', 
            'email_address', 
            'exterior_number', 
            'enableUserPhotos',
            'featured',
            'federal_entity', 
            'images',
            'internal_letter', 
            'internal_number', 
            'keywords', 
            'locality', 
            'logo',
            'municipality', 
            'name',
            'page',
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
            'service_hours',
            'settling_name', 
            'settling_type', 
            'shopping_center_name', 
            'shopping_center_store_number', 
            'shopping_center_type', 
            'verificationLevel',
            'www'
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
        VENUE_FEATURED: {
            url: 'www/img/marker_venue.png',
            size: {
                width: 30,
                height: 43
            }
        },
        VENUE_SELECTED_FEATURED: {
            url: 'www/img/marker_venue_selected.png',
            size: {
                width: 30,
                height: 43
            }
        },
        VENUE: {
            url: 'www/img/marker_d.png',
            size: {
                width: 30,
                height: 43
            }
        },
        VENUE_SELECTED: {
            url: 'www/img/marker_d_selected.png',
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
                    return VenuesService.getById($stateParams.venueId);
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

        .state('app.venueEvents', {
            url: "venues/:venueId/events",
            views: {
                'app': {
                    templateUrl: "templates/venue/events.html",
                    controller: 'VenueEventsCtrl'
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
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("start");
    });

    $ionicConfigProvider.tabs.position('bottom');

})

.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized
      }[response.status], response);
      return $q.reject(response);
    }
  };
})
 
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
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
                        deferred.resolve(response);
                    }, function(response){
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
        //Check if we have no settings in the cloud
        var wasEmpty = _.isEmpty(u.get('settings'));
        var settings = u.get('settings');
        //Assign global objects
        $rootScope.user = u;
        
        if(!_.isEmpty(settings)){
            $rootScope.settings = settings;
        }else{
            u.save('settings', AppConfig.SETTINGS);
        }
    }else{
        $rootScope.settings = AppConfig.SETTINGS;
    }
    
    $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
        if (_.isEmpty(User.current())) {
            if (next.name !== 'login') {
                event.preventDefault();
                $state.go('login');
            }
        }
    });
})
.controller('StartCtrl', function($state, $rootScope, User){
    //Redirect to proper page
    if(!!$rootScope.user){
        $state.go('app.home');
    }else{
        $state.go('login');
    }
});
