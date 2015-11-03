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
        $cordovaDialogs,
        $ionicHistory,
        $cordovaKeyboard,

        AppConfig,
        CategoriesService,
        SanitizeService,
        VenuesService,
        RoutesService,

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
        $scope.markers = [];
        $scope.points = [];
        $scope.currentMarker = false;
        $scope.currentModel = false;
        $scope.route1 = false;
        $scope.route2 = false;
        $scope.route3 = false;

        CategoriesService
            .get()
            .then(function(c) {
                if (c.length) {
                    $scope.categories = c.toKeywordsArray();
                    $scope.plainCategories = c.toPlainArray();
                } else {
                    $scope.categories = [];
                }
            }, function(error) {
                //console.log('error', error);
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
                    $scope.query = c.title + ' :: ';
                });
            });
        };

        $scope.submit = function(form) {
            $scope.routes = [];
            $scope.venue = {};
            $scope.venues = [];
            $scope.points = [];
            $scope.isSearchFocused = false;

            if($cordovaKeyboard.isVisible()){
                $cordovaKeyboard.close();
            }

            var position, p, category;
            var c = $scope.category.id;
            var q = $scope.query.split('::');
            var position = $rootScope.settings.position;
            var config = {};
            var p = $rootScope.settings.position.coords;

            q = q.length >= 2 ? q.splice(1, 1).join() : q.join();

            $cordovaProgress.showSimpleWithLabelDetail(true, 'Buscando', 'Esperen un segundo');

            if(c){
                config.categoryId = c;
            }

            config.lat = p.latitude;
            config.lng = p.longitude;

            //$state.go('app.search', config);

            //TODO: Fix backwards (attributes from URI) search
            VenuesService
                .search(position, $rootScope.settings.searchRadius, q, c)
                .then(function(venues) {
                    $timeout(function() {
                        $scope.$apply(function() {
                            $scope.venues = venues;
                            $cordovaProgress.hide();
                        });
                    });
                }, function(error) {
                    $cordovaProgress.hide();
                    $cordovaDialogs.alert(error.message)
                });
        };

        $scope.share = function() {
            var img = $scope.currentModel.getLogo();
            var id = $scope.currentModel.id;

            if ($scope.venues.length > 2) {
                msg = '!Hey! Pude encontrar ' + $scope.currentModel.get('name') + ' y otros ' + $scope.venues.length + ' establecimientos en #' + s.replaceAll($scope.currentModel.getCityName(), ' ', '') + ' usando #jound';
            } else {
                msg = '!Hey! Pude encontrar ' + $scope.currentModel.get('name') + ' en #' + s.replaceAll($scope.currentModel.getCityName(), ' ', '') + ' usando #jound';
            }

            var onShare = function() {
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };

            $cordovaSocialSharing.share(
                msg,
                img,
                null,
                'http://www.jound.mx/venue/' + id
            ).then(onShare, onShareError);
        };

        $scope.callVenue = function() {
            $state.go('/venue/' + $currentModel.id);
        };

        $scope.openVenue = function() {
            VenuesService.current($scope.currentModel);

            $timeout(function(){
                $scope.$apply(function(){
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
                                        marker: $scope.currentMarker,
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
            var onRouteFail = function() {
                $cordovaDialogs.alert('No pudimos trazar la ruta, por favor intenta de nuevo.', '¡Ups!', 'OK');
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
                    route.marker.setIcon(AppConfig.MARKERS.VENUE);
                    $scope[route.name] = false;
                });
            })
        }

        $scope.removeAllRoutes = function() {
            $scope.removeRoute($scope.route1);
            $scope.removeRoute($scope.route2);
            $scope.removeRoute($scope.route3);
        };

        $scope.$on('$ionicView.beforeLeave', function() {
            disableMap();
            $interval.cancel($scope.watchPosition);
            $cordovaKeyboard.hideAccessoryBar(false);
        });

        $scope.$on('$ionicView.enter', function() {
            enableMap();
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

            return {
                points: routePoints,
                distance: distance
            };
        };

        $scope.clearSearch = function(){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.query = '';
                    $scope.venues = [];
                });
            });
        };

        $scope.startNewBusiness = function(latlng){
            //console.log('start new business');
        };

        $ionicPlatform.ready(function() {

            $cordovaProgress.hide();
            $cordovaKeyboard.hideAccessoryBar(true);

            $scope.$watch('isSearchFocused', function(focused) {
                if ($rootScope.mainMap) {
                    $rootScope.mainMap.setClickable(!focused);
                }
            });

            $rootScope.$watch('settings.searchRadius', function(radius) {
                if ($rootScope.circle && radius) {
                    $rootScope.circle.setRadius(radius);

                    zoomToRadiusLevel(radius);
                }
            });


            $rootScope.$watch('settings.usingGeolocation', function(using) {
                if (using) {
                    getCurrentPosition();

                    $scope.watchPosition = $interval(getCurrentPosition, 20000);
                } else if ($rootScope.marker) {
                    
                    if($scope.watchPosition){
                        $interval.cancel($scope.watchPosition);
                    }

                    $rootScope.marker.setIcon(AppConfig.MARKERS.LOCATION_CUSTOM);
                }
            });

            $scope.$watch('venues', function(venues) {
                if ($scope.markers.length) {
                    _.each($scope.markers, function(m) {
                        m.remove();
                        m = null;
                    });
                }
                //Add all venues to the map
                if (venues.length) {
                    _.each(venues, function(v) {
                        addVenue(v);
                    });
                }
            });

            function addVenue(model) {
                var l = model.get('position');
                var lng = new plugin.google.maps.LatLng(l.latitude, l.longitude);

                $scope.points.push(lng);

                $scope.mainMap.addMarker({
                    position: lng,
                    data: {
                        id: model.id,
                        category: $scope.category ? $scope.category.id : undefined,
                        position: l.toJSON()
                    },
                    visible: false,
                    disableAutoPan: true,
                    markerClick: function(marker) {
                        if ($scope.currentMarker) {
                            $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE);
                        }

                        //Highlight marker
                        $timeout(function() {
                            $scope.$apply(function() {
                                $scope.currentMarker = marker;
                                $scope.currentModel = _.find($scope.venues, function(v) {
                                    return v.id === marker.get('data').id
                                });

                            });
                        });

                        marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED);
                    }
                }, function(marker) {
                    marker.setIcon(AppConfig.MARKERS.VENUE);
                    marker.setVisible(true);

                    $scope.markers.push(marker);

                    if ($scope.venues.length === 1) {
                        //Highlight marker
                        $timeout(function() {
                            $scope.$apply(function() {
                                $scope.currentMarker = marker;
                                $scope.currentModel = _.find($scope.venues, function(v) {
                                    return v.id === marker.get('data').id
                                });
                            });
                        });
                        marker.setIcon(AppConfig.MARKERS.VENUE_SELECTED);
                    }
                });
            };

            function zoomToRadiusLevel(radius) {
                if (!radius) {
                    return;
                }

                switch (radius / 1000) {
                    case 0.5:
                    case 1:
                        $rootScope.mainMap.setZoom(14);
                        break;
                    case 2:
                        $rootScope.mainMap.setZoom(13.8);
                        break;
                    case 3:
                    case 4:
                        $rootScope.mainMap.setZoom(12.5);
                        break;
                    case 5:
                        $rootScope.mainMap.setZoom(12);
                        break;
                    case 7.5:
                        $rootScope.mainMap.setZoom(11.5);
                        break;
                    case 10:
                        $rootScope.mainMap.setZoom(11);
                        break;
                    case 15:
                        $rootScope.mainMap.setZoom(10.3);
                        break;
                }
            };

            function centerMap(position) {
                if (!position && !position.coords.latitude && !position.coords.longitude) {
                    return;
                }

                var p = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                $rootScope.mainMap.setCenter(p);
                $rootScope.marker.setPosition(p);
                $rootScope.circle.setCenter(p);
            };

            function getCurrentPosition() {
                if (!$rootScope.mainMap || !$rootScope.marker) {
                    return;
                }

                $cordovaGeolocation
                    .getCurrentPosition(AppConfig.GEO.DEFAULT)
                    .then(
                        function(position) {
                            if(($rootScope.settings && !_.isEmpty($rootScope.settings.position)) && _.isEqual(position.coords, $rootScope.settings.position.coords)){
                                return;
                            }

                            $rootScope.settings.position = position;
                            $rootScope.marker.setIcon(AppConfig.MARKERS.LOCATION);
                            centerMap(position);
                        }, function(err) {
                            // error
                            //console.log(err, 'error on position');
                        });
            }

            function onMapClick() {
                if ($scope.currentMarker) {
                    $timeout(function() {
                        $scope.$apply(function() {
                            $scope.currentMarker.setIcon(AppConfig.MARKERS.VENUE);
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
                //console.log('map long click', arguments);
                //Share location or add new location
                $cordovaActionSheet.show({
                    title: '¿Que deseas hacer?',
                    buttonLabels: ['Compartir esta ubicacion', 'Agregar nuevo establecimiento'],
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
                            break;
                        case 2:
                            $scope.startNewBusiness(latlng);
                            break;
                        }
                    });
            };

            //TODO: Implement auto search
            function onMapChange(camera) {
                if($rootScope.settings.usingGeolocation){
                    return;
                }

                var position = {coords:{latitude: camera.target.lat, longitude: camera.target.lng}};
                var p = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                //Manually center map, don't use centerMap because it changes the camera position too
                $rootScope.settings.position = position;
                $rootScope.marker.setPosition(p);
                $rootScope.circle.setCenter(p);
            };

            function onMapInit() {
                $rootScope.mainMap.clear();

                var settings = $rootScope.settings;
                var p;
                var circleDefer = $q.defer();
                var markerDefer = $q.defer();
                var markerConf = {
                    icon: settings.usingGeolocation ? AppConfig.MARKERS.LOCATION : AppConfig.MARKERS.LOCATION_CUSTOM,
                    visible: false,
                    title: '',
                    snippet: ''
                };

                //Set default options
                $rootScope.mainMap.setOptions(AppConfig.MAP.DEFAULT);
                //Listen for map events
                $rootScope.mainMap.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, onMapChange);
                $rootScope.mainMap.addEventListener(plugin.google.maps.event.MAP_CLICK, onMapClick);
                $rootScope.mainMap.addEventListener(plugin.google.maps.event.MAP_LONG_CLICK, onMapLongClick);

                //Add the main radius graphic
                try {
                    $rootScope.mainMap.addCircle(
                        angular.extend({}, AppConfig.RADIUS.DEFAULT, {
                            radius: $rootScope.settings.searchRadius
                        }),
                        function(c) {
                            $rootScope.circle = c;

                            c.setVisible(true);
                            circleDefer.resolve(c);
                        }
                    );
                } catch (e) {
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
                    markerDefer.reject(e);
                }

                //Center map on last known position then get current position
                $q
                    .all([circleDefer.promise, markerDefer.promise])
                    .then(function(circle, marker) {
                        //Initialize map with user settings
                        if (settings.searchRadius) {
                            zoomToRadiusLevel(settings.searchRadius);
                        }

                        if (settings.position && settings.position.coords) {
                            p = new plugin.google.maps.LatLng(settings.position.coords.latitude, settings.position.coords.longitude);

                            $rootScope.mainMap.setCenter(p);
                            $rootScope.circle.setCenter(p);
                            $rootScope.marker.setPosition(p);
                        }

                        if ($rootScope.settings.usingGeolocation) {
                            getCurrentPosition();
                        }else{
                            p = new plugin.google.maps.LatLng(AppConfig.GEO.DEFAULT_CENTER.coords.latitude, AppConfig.GEO.DEFAULT_CENTER.coords.longitude);
                            $rootScope.circle.setCenter(p);
                            $rootScope.marker.setPosition(p);
                            $rootScope.mainMap.setCenter(p);
                        }
                    });
            };

            plugin.google.maps.Map.isAvailable(function(isAvailable, message) {
                if (isAvailable) {
                    window.mainMap = $rootScope.mainMap = plugin.google.maps.Map.getMap($scope.$map);
                    $rootScope.mainMap.addEventListener(plugin.google.maps.event.MAP_READY, onMapInit);
                }
            });
        });
    });