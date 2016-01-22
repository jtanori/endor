angular
    .module('jound.controllers')
    .controller('HomeCtrl', function(
        $scope,
        $rootScope,
        $q,
        $timeout,
        $interval,
        $ionicPlatform,
        $state,
        $stateParams,

        $cordovaDialogs,
        $cordovaGeolocation,
        $cordovaSocialSharing,
        $cordovaProgress,
        $cordovaActionSheet,
        $ionicHistory,
        $cordovaCamera,
        $cordovaKeyboard,
        $ionicModal,
        $ionicPosition,
        $cordovaToast,

        AppConfig,
        CategoriesService,
        SanitizeService,
        VenuesService,
        RoutesService,
        CameraService,
        AnalyticsService,

        VENUE_DEFAULT_IMAGE,
        BASE_64,
        NEW_VENUE_MASTER,

        focus,
        blur
    ) {
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();

        $scope.$map = document.getElementById('map');
        $scope.categories = [];
        $scope.plainCategories = [];
        $scope.query = '';
        $scope.category = '';
        $scope.isSearchFocused = false;
        $scope.categoriesFound = 0;
        $scope.routes = [];
        $scope.venue = {};
        $scope.venues = [];
        $scope.indexedVenues = {};
        $scope.featuredVenues = [];
        $scope.indexedFeaturedVenues = {};
        $scope.markers = [];
        $scope.featuredMarkers = [];
        $scope.points = [];
        $scope.currentMarker = false;
        $scope.currentModel = false;
        $scope.route1 = false;
        $scope.route2 = false;
        $scope.route3 = false;
        $scope.showLoader = false;
        $scope.centerCaptured = false;
        $scope.searchFeatured = true;

        var previousPosition, isSearching = false;

        CategoriesService
            .get()
            .then(function(c) {
                if (c.length) {
                    $scope.categories = c.toKeywordsArray();
                    $scope.plainCategories = c.toPlainArray();
                } else {
                    $scope.categories = [];
                    $scope.plainCategories = [];
                }
            }, function(error) {
                $scope.categories = [];
                $scope.plainCategories = [];
            });

        $scope.filterCategories = function() {
            var val = $scope.query.trim().toLowerCase().split(' ');
            var results = [];

            val = _.compact(val);
            val = SanitizeService.strings.sanitize(val);

            //If we have keywords
            if (val.length) {
                //Get which categories may have been selected
                _.each(val, function(v) {
                    _.each($scope.plainCategories, function(c) {
                        c = c.split('__');

                        //Check if the substring is found
                        if (c[0].indexOf(val) >= 0) {
                            if (!(c[1] in results)) {
                                results.push(c[1]);
                            }
                        }
                    });
                });

                $scope.categoriesFound = results.length;

                if (results.length) {
                    results = _.uniq(results);

                    _.each($scope.categories, function(c) {
                        if (results.indexOf(c.id) >= 0) {
                            c.selected = true;
                        } else {
                            c.selected = false;
                        }
                    });
                } else {
                    _.each($scope.categories, function(c) {
                        c.selected = false
                    });
                }
            } else {
                //Show all categories when nothing is written
                _.each($scope.categories, function(c) {
                    c.selected = true
                });
            }
        };

        $scope.selectCategory = function(c) {
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.category = c;
                    $scope.query = '';

                    AnalyticsService.track('selectCategory', {category: ''  + c.id});
                });
            });

            if(!_.isEmpty($scope.featuredVenues)){
                $scope.featuredMarkers.forEach(function(m){
                    if(c.id === m.get('data').category){
                        if(!m.isVisible()){
                            m.setVisible(true);
                        }
                    }else if(m.isVisible()){
                        m.setVisible(false);
                    }
                });
            }
        };

        $scope.submit = function(form) {
            if(isSearching){
                return;
            }

            isSearching = true;
            lockPosition();
            disableMap();

            if($scope.currentMarker && $scope.currentMarker.get('data').featured){
                $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE_FEATURED);
            }

            $scope.clearResults();
            $scope.currentMarker = null;
            $scope.currentModel = null;
            $scope.venue = {};
            $scope.points = [];
            $scope.isSearchFocused = false;
            $scope.featuredVenues = [];

            ionic.DomUtil.blurAll();

            var position, p, category;
            var c = $scope.category ? $scope.category.id : false;
            var q = $scope.query.trim();
            var r = $rootScope.settings.searchRadius;
            var excluded = $scope.featuredVenues.map(function(v){return v.id;});

            $cordovaProgress.showSimpleWithLabelDetail(true, 'Buscando', 'Esperen un segundo');

            $timeout(function(){
                var position = $rootScope.settings.position;

                //TODO: Fix backwards (attributes from URI) search
                VenuesService
                    .search(position, $rootScope.settings.searchRadius, q, c, excluded)
                    .then(function(venues) {
                        $timeout(function() {
                            enableMap()
                            $cordovaProgress.hide();
                            $scope.$apply(function() {
                                $scope.venues = venues;
                                isSearching = false;
                                AnalyticsService.track('search', {position: position.coords.latitude + ',' + position.coords.longitude, count: venues.length, latitude: position.coords.latitude, longitude: position.coords.longitude, search: q, radius: r, category: c});
                            });
                        });
                    }, function(error) {
                        enableMap();
                        $cordovaProgress.hide();
                        $timeout(function(){
                            isSearching = false;
                            $cordovaDialogs.alert(error.message);
                            AnalyticsService.track('error', {type: 'search', position: position.coords.latitude + ',' + position.coords.longitude, type: 'search', code: error.code, message: error.message, latitude: position.coords.latitude, longitude: position.coords.longitude, search: q, radius: r, category: c});
                        });
                    });
            }, 300);
        };

        $scope.clearCategory = function(){
            $scope.category = false;

            if(!$scope.query.length){
                $scope.clearResults();
                $scope.currentMarker = null;
                $scope.currentModel = null;
                $scope.points = [];
            }

            if(!_.isEmpty($scope.featuredVenues)){
                $scope.featuredMarkers.forEach(function(m){
                    if(!m.isVisible()){
                        m.setVisible(true);
                    }
                });
            }

            _.each($scope.categories, function(c) {
                c.selected = true
            });
        }

        $scope.share = function() {
            var img = $scope.currentModel.getLogo();
            var id = $scope.currentModel.id;

            if ($scope.venues.length > 2) {
                msg = '!Hey! Pude encontrar ' + $scope.currentModel.get('name') + ' y otros ' + $scope.venues.length + ' establecimientos en #' + s.replaceAll($scope.currentModel.getCityName(), ' ', '') + ' usando #jound';
            } else {
                msg = '!Hey! Pude encontrar ' + $scope.currentModel.get('name') + ' en #' + s.replaceAll($scope.currentModel.getCityName(), ' ', '') + ' usando #jound';
            }

            $cordovaSocialSharing.share(
                msg,
                img,
                null,
                'http://www.jound.mx/venues/' + id
            )
            .then(function(results){
                AnalyticsService.track('shareVenue', {id: id});
            }, function(e){
                AnalyticsService.track('error', {type: 'shareVenue', code: e.code, message: e.message, id: id});
            });
        };

        $scope.openVenue = function() {
            VenuesService.current($scope.currentModel);

            $timeout(function(){
                $scope.$apply(function(){
                    AnalyticsService.track('openVenue', {origin: 'home', id: $scope.currentModel.id});
                    $state.go('app.venue', {venueId: $scope.currentModel.id});
                });
            });
        }

        $scope.traceRoute = function() {
            var from, to, l, p;
            var onRoute = function(r) {
                if (r.data && r.data.status === 'success') {
                    var routeData = getRoutePoints(r.data.results.routes);

                    if (!routeData.points.length) {
                        return;
                    }

                    var routeConfig = {};
                    var markerStyle;
                    var routeObj;

                    if (!$scope.route1) {
                        routeObj = 'route1';
                        routeConfig = angular.extend({}, AppConfig.ROUTES.A, {
                            points: routeData.points
                        });
                        markerStyle = AppConfig.MARKERS.A_SELECTED;
                    } else if ($scope.route1 && !$scope.route2) {
                        routeObj = 'route2';
                        routeConfig = angular.extend({}, AppConfig.ROUTES.B, {
                            points: routeData.points
                        });
                        markerStyle = AppConfig.MARKERS.B_SELECTED;
                    } else if ($scope.route1 && $scope.route2 && !$scope.route3) {
                        routeObj = 'route3';
                        routeConfig = angular.extend({}, AppConfig.ROUTES.C, {
                            points: routeData.points
                        });
                        markerStyle = AppConfig.MARKERS.D_SELECTED;
                    } else {
                        $scope.route3.route.remove();
                        $scope.route3.marker.setIcon(AppConfig.MARKERS.VENUE);
                        $scope.route3 = false;
                        routeObj = 'route3';

                        routeConfig = angular.extend({}, AppConfig.ROUTES.C, {
                            points: routeData.points
                        });
                        markerStyle = AppConfig.MARKERS.D_SELECTED;
                    }

                    $rootScope.mainMap.addPolyline(
                        routeConfig,
                        function(polyline) {
                            $timeout(function() {
                                $scope.$apply(function() {
                                    $scope[routeObj] = {
                                        name: routeObj,
                                        line: polyline,
                                        marker: $scope.currentMarker.get('data').id,
                                        points: routeConfig.points,
                                        distance: routeData.distance
                                    };
                                    $scope.currentMarker.setIcon(markerStyle);
                                });
                            })
                        }
                    );
                }
            };
            var onRouteFail = function(e) {
                AnalyticsService.track('error', {type: 'traceRoute', code: e.code, message: e.message});
                $timeout(function(){
                    $cordovaDialogs.alert('No pudimos trazar la ruta, por favor intenta de nuevo.', '¡Ups!', 'OK');
                });
            };

            l = $scope.currentModel.get('position');
            p = $scope.settings.position;
            from = p.coords.latitude + ',' + p.coords.longitude;
            to = l.latitude + ',' + l.longitude;

            $cordovaActionSheet.show({
                title: '¿Como piensas llegar?',
                buttonLabels: ['Caminando', 'En auto'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            })
                .then(function(btnIndex) {
                    var index = btnIndex;
                    var mode;

                    switch(index){
                    case 1:
                        mode = 'walking';
                        break;
                    case 3: return;
                    }

                    AnalyticsService.track('traceRoute', {mode: mode || 'driving', fromLatitude:  p.coords.latitude, fromLongitude:  p.coords.longitude, toLatitude:  l.latitude, toLongitude:  l.longitude, position: l.latitude + ',' + l.longitude});

                    //Get route directions
                    RoutesService
                        .trace(from, to, mode)
                        .then(onRoute, onRouteFail);
                });
        };

        $scope.removeRoute = function(route) {
            if (!route) {
                return;
            }

            $timeout(function() {
                $scope.$apply(function() {
                    route.line.remove();
                    $scope[route.name] = null;

                    _.each($scope.markers, function(m){
                        if(m.get('data').id == route.marker){
                            m.setIcon(AppConfig.MARKERS.VENUE);
                        }
                    });

                    route = null;
                });
            })
        }

        $scope.removeAllRoutes = function() {
            $scope.removeRoute($scope.route1);
            $scope.removeRoute($scope.route2);
            $scope.removeRoute($scope.route3);
        };

        $scope.$on('updateFeatured', function(e, exclude){
            if(!exclude && $scope.featuredVenues.length){
                $scope.featuredVenues = [];
            }

            getFeaturedVenues($rootScope.settings.position, $rootScope.settings.searchRadius);
        });

        $scope.$on('$ionicView.leave', function() {
            disableMap();
            $interval.cancel($scope.watchPosition);
            $scope.watchPosition = null;
            $cordovaKeyboard.hideAccessoryBar(false);
        });

        $scope.$on('$ionicView.enter', function() {
            enableMap();

            var clearSearchButton = angular.element(document.getElementById('home-search-clear'));
            var searchBoxPosition = $ionicPosition.position(angular.element(document.getElementById('home-search-box')));
            var position = searchBoxPosition.left + searchBoxPosition.width;

            $timeout(function(){
                $scope.$apply(function(){
                    clearSearchButton.css('left', position + 'px');
                });
            });

            AnalyticsService
                .ready()
                .then(function(){
                    AnalyticsService.track('home', {type: 'enter'});
                });

        });

        $rootScope.$watch('user', function(newUser, prevUser){
            if(newUser && !newUser.isAnonimous()){
                $scope.clearResults();
                $scope.currentMarker = null;
                $scope.currentModel = null;
                $scope.venue = {};
                $scope.points = [];
                $scope.isSearchFocused = false;
                $scope.featuredVenues = [];
            }
        });

        function disableMap() {
            if ($rootScope.mainMap) {
                $rootScope.mainMap.setClickable(false);
            }
        };

        function enableMap() {
            if ($rootScope.mainMap) {
                $rootScope.mainMap.setClickable(true);
            }
        };

        function getRoutePoints(routes) {
            var routePoints = [];
            var distance = 0;

            _.each(routes, function(route) {
                _.each(route.legs, function(leg) {
                    distance = leg.distance.text;
                    _.each(leg.steps, function(l) {
                        l.decoded_polyline.forEach(function(pl) {
                            routePoints.push(new plugin.google.maps.LatLng(pl[0], pl[1]));
                        });
                    });
                });
            });

            AnalyticsService.track('getRoutePoints', {distance: distance});

            return {
                points: routePoints,
                distance: distance
            };
        };

        $scope.clearSearch = function(){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.query = '';
                    $scope.clearResults();
                    $scope.currentMarker = null;
                    $scope.currentModel = null;
                    ionic.DomUtil.blurAll();
                    $cordovaKeyboard.close();
                });
            });
        };

        $scope.clearResults = function(){
            _.each($scope.venue, function(v){v = null;});
            _.each($scope.markers, function(m){m.remove(); m = null});
            $scope.venues = [];
            $scope.markers = [];
            $scope.removeAllRoutes();
        };

        $scope.newBusinessMarker = null;
        $scope.newBusiness = angular.copy(NEW_VENUE_MASTER);
        $scope.newBusinessImageDefault = VENUE_DEFAULT_IMAGE.large;
        $scope.base64JPG = BASE_64.JPG;
        $scope.newBusinessImageSRC = '';
        $scope.newVenue = null;
        $scope.startNewBusiness = function(latlng){
            $scope.clearSearch();
            $scope.clearCategory();

            if(!$scope.mainMap || !latlng) {
                return;
            }

            $scope.mainMap.addMarker({
                position: latlng,
                data: {
                    position: latlng
                },
                draggable: true,
                animation: plugin.google.maps.Animation.DROP,
                icon: AppConfig.MARKERS.B_SELECTED
            }, function(marker){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.newBusinessMarker = marker;
                        $scope.newBusinessImageSRC = $scope.newBusinessImageDefault;
                    });
                });

                $rootScope.mainMap.animateCamera({
                    target: latlng,
                    zoom: 16,
                    duration: 1000
                })
                $rootScope.$broadcast('venue:new');
            });
        };

        $scope.$on('venue:new:frommenu', function(){
            $rootScope.mainMap.getCameraPosition(function(c){
                $scope.startNewBusiness(c.target);
            });
        });

        $scope.takePhoto = function(){
            CameraService
                .ready()
                .then(function(){
                    CameraService
                        .take()
                        .then(function(image){
                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.newBusinessImageSRC = image;
                                });
                            });
                        }, function(e){
                            $timeout(function(){
                                $cordovaDialogs.alert(e.message);
                            });

                        });
                });
        };

        $scope.getNewBusinessAddress = function(){
            var marker = $scope.newBusinessMarker;
            var position;

            if(!marker){
                return;
            }

            position = marker.get('data').position;

            VenuesService
                .getAddressComponents(position)
                .then(function(address){
                    $scope.newVenue.position = position;
                    $scope.newVenue.address = address;

                    openNewBusinessModal();
                }, function(e){
                    $timeout(function(){
                        $cordovaDialogs.alert(e.message);
                    });
                });
        };

        var openNewBusinessModal = function(){
            if(!$scope.newBusinessModal){
                $ionicModal.fromTemplateUrl('templates/venue/claim.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    $scope.newBusinessModal = modal;
                    $scope.newBusinessModal.show();
                });
            }else{
                $scope.newBusinessModal.show();
            }
        }


        $scope.saveNewBusiness = function(){
            var nb = $scope.newBusiness;
            var marker = $scope.newBusinessMarker;
            var position;

            if(!marker){
                return;
            }

            position = marker.get('data').position;

            //Tell not to use any image if default is selected
            if($scope.newBusinessImageSRC !== $scope.newBusinessImageDefault){
                nb.image = $scope.newBusinessImageSRC;
            }else{
                nb.image = null;
            }

            VenuesService
                .new(position, nb.name, nb.phone, nb.image, nb.owner)
                .then(function(venue){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.newBusinessMarker.remove();
                            $scope.newBusinessMarker = null;
                            $scope.newBusiness = angular.copy(NEW_VENUE_MASTER);
                            $scope.newBusinessImageSRC = $scope.newBusinessImageDefault;
                            $scope.venues = [venue];
                        });
                    });
                }, function(e){
                    $timeout(function(){
                        $cordovaDialogs.alert(e.message);
                    });
                });
        };

        $scope.cancelNewBusiness = function(){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.newBusinessMarker.remove();
                    $scope.newBusinessMarker = null;
                    $scope.newBusiness = angular.copy(NEW_VENUE_MASTER);
                    $scope.newBusinessImageSRC = $scope.newBusinessImageDefault;
                });
            });

            $scope.$emit('venue:new:cancel');
        };

        var getFeaturedVenues = function(p, r) {
            if(!$scope.searchFeatured) {
                return;
            }

            var excludedVenues = $scope.featuredVenues.map(function(v){return v.id;});

            VenuesService
                .getFeatured(p, r, $scope.category.id, excludedVenues)
                .then(function(venues) {
                    AnalyticsService.track('getFeaturedVenues', {radius:  r, latitude:  p.coords.latitude, longitude:  p.coords.longitude, position: p.coords.latitude + ',' + p.coords.longitude});

                    $timeout(function() {
                        $scope.$apply(function() {
                            if(excludedVenues.length){
                                $scope.featuredVenues = $scope.featuredVenues.concat(venues);
                            }else{
                                $scope.featuredVenues = venues;
                            }
                        });
                    });
                }, function(e){
                    AnalyticsService.track('error', {type: 'getFeaturedVenues', radius:  r, latitude:  p.coords.latitude, longitude:  p.coords.longitude, code: e.code, message: e.message, position: p.coords.latitude + ',' + p.coords.longitude});
                });
        }

        var lockPosition = function(lock){
            $scope.centerCaptured = lock === false ? false : true;

            var message;
            if($scope.centerCaptured){
                message = 'Posicion capturada';
            }else{
                message = 'Posicion liberada';
            }

            $cordovaToast.showShortBottom(message);
        }

        var releasePosition = function(){
            lockPosition(false);
        }

        $ionicPlatform.ready(function() {

            $cordovaKeyboard.hideAccessoryBar(true);

            $scope.$watch('isSearchFocused', function(focused) {
                if ($rootScope.mainMap) {
                    $rootScope.mainMap.setClickable(!focused);
                }
            });

            $rootScope.$watch('settings.searchRadius', function(radius, previousRadius) {
                //console.log('search radius changed', onMapChangeTimeout, radius, previousRadius);

                if ($rootScope.circle && radius) {
                    AnalyticsService.track('searchRadiusChange', {radius: radius});
                    $rootScope.circle.setRadius(radius);

                    zoomToRadiusLevel(radius);
                }else{
                    AnalyticsService.track('error', {type: 'usingGelocationChange', message: 'No circle or radius defined', radius:  radius, circle: !!$rootScope.circle});
                }
            });

            $rootScope.$watch('settings.usingGeolocation', function(using) {
                if(!$rootScope.user){
                    return;
                }

                if (using) {
                    AnalyticsService.track('usingGelocationChange', {using: 'true'});
                    getCurrentPosition();
                } else if ($rootScope.marker) {

                    if($scope.watchPosition){
                        $interval.cancel($scope.watchPosition);
                        $scope.watchPosition = null;
                    }

                    $rootScope.marker.setIcon(AppConfig.MARKERS.LOCATION_CUSTOM);

                    AnalyticsService.track('usingGelocationChange', {using: using, freestyle: 'true'});
                    releasePosition();
                }

                zoomToRadiusLevel($rootScope.settings.searchRadius);
            });

            $scope.$watch('venues', function(venues) {
                var v = venues.map(function(v){return v.id;});

                if ($scope.markers.length) {
                    _.each($scope.markers, function(m) {
                        m.remove();
                        m = null;
                    });

                    $scope.markers = [];
                }
                //Add all venues to the map
                if (venues.length) {
                    $scope.indexedVenues = _.indexBy(venues, 'id');

                    _.each(venues, function(v) {
                        addVenue(v);
                    });
                }else{
                    $scope.indexedVenues = {};
                }
            });

            $scope.$watch('featuredVenues', function(venues){
                var v = venues.map(function(v){return v.id;});

                if($scope.featuredMarkers.length){
                    _.each($scope.featuredMarkers, function(m){
                        //TODO: Enhance this
                        //      Keep current selected featured marker if present in new results
                        //Release selected model if it has dissapeared
                        if($scope.currentMarker && $scope.currentMarker.get('data').id === m.get('data').id){
                            $scope.currentMarker = null;
                        }

                        m.remove();
                        m = null;
                    });

                    $scope.featuredMarkers = [];
                }

                if(venues.length){
                    $scope.indexedFeaturedVenues = _.indexBy(venues, 'id');

                    _.each(venues, function(v){
                        addVenue(v, true);
                    });
                }else{
                    $scope.indexedFeaturedVenues = {};
                }
            });

            $scope.clearSelectedVenue = function(){
                onMapClick();
            }

            function addVenue(model, isFeatured) {
                var l = model.get('position');
                var lng = new plugin.google.maps.LatLng(l.latitude, l.longitude);

                $scope.points.push(lng);

                $scope.mainMap.addMarker({
                    position: lng,
                    data: {
                        id: model.id,
                        category: model.get('category').id,
                        position: l.toJSON(),
                        featured: model.get('featured')
                    },
                    visible: false,
                    disableAutoPan: true,
                    markerClick: function(marker) {
                        var isFeatured = marker.get('data').featured;

                        if ($scope.currentMarker) {
                            if($scope.currentMarker.get('data').featured){
                                $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE_FEATURED);
                            }else{
                                $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE);
                            }
                        }

                        if (isFeatured) {
                            marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED_FEATURED);
                        } else {
                            marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED);
                        }

                        //Highlight marker
                        $timeout(function() {
                            $scope.$apply(function() {
                                var id = marker.get('data').id;

                                $scope.currentMarker = marker;
                                $scope.currentModel = $scope.indexedVenues[id] ? $scope.indexedVenues[id] : $scope.indexedFeaturedVenues[id];

                                AnalyticsService.track('venueClick', {id: id, isFeatured: isFeatured});
                            });
                        });
                    }
                }, function(marker) {
                    var $venues = $scope.venues;
                    var isFeatured = marker.get('data').featured;

                    if(isFeatured){
                        $venues = $scope.featuredVenues;
                        marker.setIcon(AppConfig.MARKERS.VENUE_FEATURED);
                        $scope.featuredMarkers.push(marker);
                    }else{
                        marker.setIcon(AppConfig.MARKERS.VENUE);
                        $scope.markers.push(marker);
                    }

                    marker.setVisible(true);

                    if ($scope.venues.length === 1) {
                        //Highlight marker
                        $timeout(function() {
                            $scope.$apply(function() {
                                var id = marker.get('data').id;

                                $scope.currentMarker = marker;
                                $scope.currentModel = $scope.indexedVenues[id] ? $scope.indexedVenues[id] : $scope.indexedFeaturedVenues[id];
                            });
                        });

                        if(isFeatured){
                            marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED_FEATURED);
                        }else{
                            marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED);
                        }
                    }
                });
            };

            function zoomToRadiusLevel(radius) {
                var deferred = $q.defer();

                if (!radius) {
                    deferred.reject({message: 'No radius provided', code: 2});
                }else if(!$rootScope.mainMap){
                    deferred.reject({message: 'Map is not ready yet', code: 1});
                }else {
                    switch (radius / 1000) {
                        case 0.5:
                            $rootScope.mainMap.setZoom(15.4);
                            deferred.resolve(radius/1000);
                            break;
                        case 1:
                            $rootScope.mainMap.setZoom(14.4);
                            deferred.resolve(radius/1000);
                            break;
                        case 2:
                            $rootScope.mainMap.setZoom(13.3);
                            deferred.resolve(radius/1000);
                            break;
                        case 3:
                        case 4:
                            $rootScope.mainMap.setZoom(12.5);
                            deferred.resolve(radius/1000);
                            break;
                        case 5:
                            $rootScope.mainMap.setZoom(12);
                            deferred.resolve(radius/1000);
                            break;
                        case 7.5:
                            $rootScope.mainMap.setZoom(11.5);
                            deferred.resolve(radius/1000);
                            break;
                        case 10:
                            $rootScope.mainMap.setZoom(11);
                            deferred.resolve(radius/1000);
                            break;
                        case 15:
                            $rootScope.mainMap.setZoom(10.3);
                            deferred.resolve(radius/1000);
                            break;
                        default:
                            AnalyticsService.track('error', {type: 'zoomToRadiusLevel', code: 3, message: 'No valid radius provided'});
                            deferred.reject({message: 'No valid radius provided', code: 3});
                            break;
                    }
                }

                return deferred.promise;
            };

            function centerMap(position, fromInterval) {
                if (!position || !position.coords || !_.isNumber(position.coords.latitude) && !_.isNumber(position.coords.longitude)) {
                    return;
                }

                var p = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                $timeout(function(){
                    $rootScope.$apply(function(){
                        if(!fromInterval){
                            $rootScope.mainMap.setCenter(p);
                            AnalyticsService.track('centerMap', {position: position.coords.latitude + ',' + position.coords.longitude});
                        }
                        $rootScope.marker.setPosition(p);
                        $rootScope.circle.setCenter(p);
                    });
                });
            };

            function getCurrentPosition(fromInterval) {
                if (!$rootScope.mainMap || !$rootScope.marker) {
                    return;
                }

                var deferred = $q.defer();

                if(!fromInterval){
                    $scope.tracingPosition = true;
                }

                if($ionicHistory.currentView().stateName !== 'app.home'){
                    deferred.reject({message: 'Home is not active', code: 300});
                }else{
                    $cordovaGeolocation
                        .getCurrentPosition(AppConfig.GEO.DEFAULT)
                        .then(
                            function(position) {
                                $rootScope.marker.setIcon(AppConfig.MARKERS.LOCATION);

                                if(($rootScope.settings && !_.isEmpty($rootScope.settings.position)) && _.isEqual(position.coords, $rootScope.settings.position.coords)){
                                    $scope.tracingPosition = false;
                                    deferred.resolve(position);
                                    return;
                                }

                                centerMap(position, fromInterval);

                                if(!$scope.watchPosition){
                                    $scope.watchPosition = $interval(function(){
                                        getCurrentPosition(true);
                                    }, 20000);
                                }

                                previousPosition = {coords:{latitude: position.coords.latitude, longitude: position.coords.longitude}};

                                $scope.tracingPosition = false;
                                $rootScope.settings.position = previousPosition;

                                $rootScope.user.save({
                                    'settings': $rootScope.settings,
                                    'lastPosition': new Parse.GeoPoint({
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    })
                                });

                                AnalyticsService.track('getCurrentPosition', {type: 'success', position: position.coords.latitude + ',' + position.coords.longitude, latitude: position.coords.latitude, longitude: position.coords.longitude});

                                deferred.resolve(position);
                            }, function(e) {
                                $scope.tracingPosition = false;

                                AnalyticsService.track('error', {type: 'getCurrentPosition', message: e.message, code: e.code});

                                deferred.reject(e);
                            });
                }

                return deferred.promise;
            }

            function onMapClick() {
                if ($scope.currentMarker) {
                    $timeout(function() {
                        $scope.$apply(function() {
                            if($scope.currentMarker.get('data').featured){
                                $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE_FEATURED);
                            }else{
                                $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE);
                            }

                            $scope.currentModel = false;
                        });
                    })
                }

                if ($scope.route1 || $scope.route2 || $scope.route3) {
                    $scope.removeAllRoutes();
                }
            };

            //Implement add new venue
            function onMapLongClick(latlng) {
                if($scope.newBusinessMarker){
                    return;
                }

                //Share location or add new location
                $cordovaActionSheet.show({
                    title: '¿Que deseas hacer?',
                    buttonLabels: ['Compartir esta ubicacion'/*, 'Agregar nuevo establecimiento'*/],
                    addCancelButtonWithLabel: 'Cancelar',
                    androidEnableCancelButton: true,
                    winphoneEnableCancelButton: true
                })
                    .then(function(btnIndex) {
                        var index = btnIndex;
                        var url = 'https://www.google.com/maps/place/@' + latlng.lat + ',' + latlng.lng + ',16z/data=!4m2!3m1!1s0x0:0x0';

                        switch(index){
                        case 1:
                            $cordovaSocialSharing.share(
                                'Compartir ubicacion via #jound',
                                null,
                                null,
                                url
                            );
                            AnalyticsService.track('positionSharing', {position: latlng.lat + ',' + latlng.lng, latitude: latlng.lat, longitude: latlng.lng});
                            break;
                        case 2:
                            //$scope.startNewBusiness(latlng);
                            break;
                        }
                    });
            };

            //TODO: Implement auto search
            var onMapChangeTimeout = null;
            function onMapChange(camera) {
                if($rootScope.settings.usingGeolocation || $scope.centerCaptured){
                    return;
                }

                var latlng = {lat: camera.target.lat, lng: camera.target.lng};
                var position = {coords:{latitude: latlng.lat, longitude: latlng.lng}};
                var p = new plugin.google.maps.LatLng(latlng.lat, latlng.lng);

                //Manually center map, don't use centerMap because it changes the camera position too
                $rootScope.settings.position = position;
                $rootScope.marker.setPosition(p);
                $rootScope.circle.setCenter(p);

                if(onMapChangeTimeout){
                    $timeout.cancel(onMapChangeTimeout);
                }

                //Create timeout
                onMapChangeTimeout = $timeout(function(){
                    var settings = $rootScope.user.get('settings');
                    var distance = 0, maxDistanceToRefresh = AppConfig.MAX_DISTANCE_TO_REFRESH;

                    settings = $rootScope.settings;

                    $rootScope.user.save('settings', settings);
                    onMapChangeTimeout = null;

                    if(previousPosition){
                        distance = RoutesService.distance(previousPosition.coords, position.coords);
                    }

                    previousPosition = position;

                    if(distance > maxDistanceToRefresh){
                        getFeaturedVenues({coords: {latitude: latlng.lat, longitude: latlng.lng}}, $rootScope.settings.searchRadius);
                    }
                }, 1000);
            }

            var removeOutOfRangeFeaturedTimeout;
            function removeOutOfRangeFeatured(){

                if(removeOutOfRangeFeaturedTimeout){
                    $timeout.cancel(removeOutOfRangeFeaturedTimeout);
                }

                if(!_.isEmpty($scope.featuredVenues)){
                    removeOutOfRangeFeaturedTimeout = $timeout(function(){
                        $rootScope.mainMap.getCameraPosition(function(camera){
                            var position = {latitude: camera.target.lat, longitude: camera.target.lng};
                            var radius = $rootScope.settings.searchRadius;
                            var maxDistanceToRemove = radius + (AppConfig.MAX_DISTANCE_TO_REFRESH/2);
                            var tobeIncluded = [];
                            var tobeRemoved = _.chain($scope.featuredVenues).map(function(v){
                                var p = v.get('position');
                                var distance = RoutesService.distance(position, {latitude: p.latitude, longitude: p.longitude});

                                if(distance > maxDistanceToRemove){
                                    return v.id;
                                }else{
                                    tobeIncluded.push(v.id);
                                }
                            }).compact().value();

                            if(!_.isEmpty(tobeRemoved)){
                                tobeRemoved.forEach(function(id){
                                    $scope.featuredMarkers.forEach(function(m){
                                        if(m.get('data').id === id){
                                            m.setVisible(false);
                                        }
                                    });
                                });
                            }

                            if(!_.isEmpty(tobeIncluded)){
                                tobeIncluded.forEach(function(id){
                                    $scope.featuredMarkers.forEach(function(m){
                                        if(m.get('data').id === id && !m.isVisible()){
                                            m.setVisible(true);
                                        }
                                    });
                                });
                            }
                        });
                    }, 1500);
                }
            }

            function onMapInit() {
                $rootScope.mainMap.clear();

                var settings = $rootScope.settings;
                var p;
                var circleDefer = $q.defer();
                var markerDefer = $q.defer();
                var markerConf = {
                    icon: settings.usingGeolocation ? AppConfig.MARKERS.LOCATION : AppConfig.MARKERS.LOCATION_CUSTOM,
                    visible: false,
                    markerClick: function(marker){
                        if(!$rootScope.settings.usingGeolocation){
                            lockPosition(!$scope.centerCaptured);
                        }else{
                            $cordovaToast.showLongBottom('Esta es tu posicion, segun la red U_U');
                        }
                    }
                };

                //Set default options
                $rootScope.mainMap.setOptions(AppConfig.MAP.DEFAULT);
                //Add the main radius graphic
                try {
                    $rootScope.mainMap.addCircle(
                        angular.extend({}, AppConfig.RADIUS.DEFAULT, {
                            radius: $rootScope.settings.searchRadius
                        }),
                        function(c) {
                            $rootScope.circle = c;

                            c.on(plugin.google.maps.event.OVERLAY_CLICK, onMapClick);
                            c.setVisible(true);
                            circleDefer.resolve(c);
                        }
                    );
                } catch (e) {
                    AnalyticsService.track('error', {message: e.message, code: e.code, type: 'radiusInit'});
                    circleDefer.reject(e);
                }

                //Add the position pointer
                try {
                    $rootScope.mainMap.addMarker(markerConf, function(marker) {
                        $rootScope.marker = marker;

                        marker.setIconAnchor(10, 10);
                        marker.setVisible(true);
                        marker.setDraggable(false);
                        markerDefer.resolve(marker);
                    });
                } catch (e) {
                    AnalyticsService.track('error', {message: e.message, code: e.code, type: 'markerInit'});
                    markerDefer.reject(e);
                }

                //Center map on last known position then get current position
                $q
                    .all([circleDefer.promise, markerDefer.promise])
                    .then(function(circle, marker) {
                        zoomToRadiusLevel(settings.searchRadius || AppConfig.SETTINGS.searchRadius)
                            .then(function(level){
                                onFirstZoom(null, level);
                            }, function(error){
                                onFirstZoom(error);
                            });
                    }, function(e){
                        $timeout(function(){
                            $cordovaDialogs.alert(e.message);
                        });
                        AnalyticsService.track('error', {message: e.message, code: e.code});
                    });
            };

            function onFirstZoom(error, zoomedTo){
                var settings = $rootScope.settings;

                if(error){
                    AnalyticsService.track('error', {code: e.code, message: e.message});
                }

                if(settings.usingGeolocation){
                    getCurrentPosition()
                        .then(function(position){
                            if(position){
                                getFeaturedVenues(position, $rootScope.settings.searchRadius);
                                if(!$rootScope.mainMapReady){
                                    $timeout(function(){
                                        $rootScope.mainMapReady = true;
                                    }, 1000);
                                }
                            }else{
                                tryDefaultPosition();
                            }
                        }, function(e){
                            if(e.code !== 300){
                                $timeout(function(){
                                    AnalyticsService.track('error', {type: 'getCurrentPosition', message: 'Error getting position, fallback to defaults', code: 4});
                                    $cordovaDialogs.alert('Ha ocurrido un error al intentar trazar tu ubicacion, por favor intenta de nuevo.');
                                    tryDefaultPosition();
                                });
                            }
                        });
                }else{
                    tryDefaultPosition();
                }
            }

            function tryDefaultPosition(){
                var settings = $rootScope.settings;
                var p;

                if(settings.position && settings.position.coords){
                    p = settings.position.coords;
                    AnalyticsService.track('position', {position: p.latitude + ',' + p.longitude, type: 'fromSettings', latitude: p.latitude, longitude: p.longitude, position: p.latitude + ',' + p.longitude});
                }else{
                    p = AppConfig.GEO.DEFAULT_CENTER.coords;
                    AnalyticsService.track('warning', {type: 'positionDefault'});
                }

                previousPosition = {coords: {latitude: p.latitude, longitude: p.longitude}};

                getFeaturedVenues(previousPosition, $rootScope.settings.searchRadius);
                centerMap(previousPosition);

                if(!$rootScope.mainMapReady){
                    $timeout(function(){
                        $rootScope.mainMapReady = true;
                    }, 1000);
                }
            }

            $rootScope.$watch('mainMapReady', function(map, oldMap){
                if(map && _.isUndefined(oldMap)){
                    //Listen for map events
                    $rootScope.mainMap.on(plugin.google.maps.event.MAP_CLICK, onMapClick);
                    $rootScope.mainMap.on(plugin.google.maps.event.CAMERA_CHANGE, removeOutOfRangeFeatured);
                    //$rootScope.mainMap.on(plugin.google.maps.event.MAP_LONG_CLICK, onMapLongClick);
                    $rootScope.mainMap.on(plugin.google.maps.event.CAMERA_CHANGE, onMapChange);
                }
            });

            plugin.google.maps.Map.isAvailable(function(isAvailable, message) {
                if (isAvailable) {
                    $rootScope.mainMap = plugin.google.maps.Map.getMap($scope.$map);
                    $rootScope.mainMap.addEventListener(plugin.google.maps.event.MAP_READY, onMapInit);
                }
            });
        });
    });
