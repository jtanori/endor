angular
    .module('jound.controllers')
    .filter('unsafe', function($rootScope, $sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    })
    .controller('VenueCtrl', function(
        $scope,
        $rootScope,
        $state,
        $stateParams,
        $timeout,
        $cordovaInAppBrowser,
        $cordovaSocialSharing,
        $ionicModal,
        $ionicLoading,
        $ionicHistory,
        $cordovaDialogs,
        $cordovaProgress,
        $cordovaToast,
        $ionicPlatform,
        $ionicSlideBoxDelegate,
        $ionicScrollDelegate,
        $cordovaSplashscreen,
        VenuesService,
        LinksService,
        CameraService,
        AnalyticsService,
        venue,
        User,
        AppConfig,
        WEEKDAYS
    ) {
        AnalyticsService
            .ready()
            .then(function(){
                AnalyticsService.track('loadVenue', {venue: venue.id});
            });

        VenuesService.current(venue);

        $scope.venue = venue;
        $scope.venueId = venue.id;
        $scope.basicData = venue.getBasicData();
        $scope.logo = $scope.basicData.logo;
        $scope.cover = $scope.basicData.cover;
        $scope.coverVideo = venue.get('cover_video');

        $scope.images = [$scope.cover].concat(venue.getImages());
        $scope.page = venue.get('page') ? venue.get('page').toJSON() : undefined;
        $scope.videos = [];
        $scope.videoInfo = {};
        $scope.socialImages = [];
        $scope.twitts = [];
        $scope.lastTweet = undefined;
        $scope.firstTweet = undefined;
        $scope.firstImage = undefined;
        $scope.lastImage = undefined;
        $scope.videoPageToken = true;
        $scope.rating = venue.get('rating') || 0;
        $scope.max = 5;
        $scope.user = $rootScope.user.toJSON();
        $scope.user.avatar = $rootScope.user.getAvatar();
        $scope.enableUserPhotos = venue.get('enableUserPhotos') === false ? false : true;
        $scope.twentyFourSeven = false;
        $scope.serviceHours = [];
        $scope.claimMaster = {
            name: '',
            surname: '',
            phone: '',
            comments: '',
            phoneContact: false
        };
        $scope.bugMaster = {
            comments: '',
            problemType: 0
        };
        $scope.bug = angular.copy($scope.bugMaster);
        $scope.zoomMin = 1;
        $scope.swiper = null;

        var serviceHours = [];
        var master_day = {name: '', capital: ''};
        var currentDay, everyDay;

        $timeout(function(){
            $scope.$apply(function(){
                if($scope.page){
                    $scope.twitter = $scope.page.twitter ? $scope.page.twitter.account : false;
                    $scope.instagram = $scope.page.photoFeed && $scope.page.photoFeed.type === 'instagram' ? $scope.page.photoFeed.account : false;
                    $scope.facebook = $scope.page.facebook && $scope.page.facebook.id ? $scope.page.facebook.id : false;
                    $scope.pinterest = $scope.page.pinterest ? $scope.page.pinterest.account : false;
                    $scope.youtube = $scope.page.videoFeed ? $scope.page.videoFeed.account : false;
                }
            });
        });

        if(venue.get('service_hours')){
            serviceHours = venue.get('service_hours');

            twentyFourSeven = serviceHours.filter(function(d){
                if(d.days === "*" && d.hours === "*"){
                    return true;
                }
            }).length;

            if(!twentyFourSeven){
                everyDay = serviceHours.filter(function(d){
                    if(d.days === "*"){
                        return true;
                    }
                }).length;

                if(everyDay){
                    serviceHours = WEEKDAYS.map(function(d){
                        return angular.extend({}, d, {hours: serviceHours[0].hours});
                    });

                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.serviceHours = serviceHours;
                        });
                    });
                }else{
                    serviceHours = serviceHours.map(function(r){


                        if(_.isArray(r.days)){
                            r = r.map(function(d){
                                return angular.extend({}, WEEKDAYS[d], {hours: r.hours});
                            });
                        }else if(_.isNumber(r.days) && WEEKDAYS[r.days]){
                            r = angular.extend({}, WEEKDAYS[r.days], {hours: r.hours});
                        }


                    });

                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.serviceHours = serviceHours;
                        });
                    });
                }
            }else{
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.twentyFourSeven = twentyFourSeven;
                    });
                });
            }
        }

        $scope.getVideos = function(){
            $scope.refreshVideos();
        };

        $scope.refreshVideos = function(pageToken){
            var config = $scope.page.videoFeed;
            //Check if we want to paginate instead
            if(pageToken && _.isString(pageToken)){
                config = angular.extend({}, config, {pageToken: pageToken});
            }

            AnalyticsService.track('refreshVideos', {venue: venue.id});

            VenuesService
                .getChannel(config)
                .then(function(response){
                    $scope.videos = $scope.videos.concat(response.data.items);
                    $scope.videoPageToken = response.data.nextPageToken;
                    $scope.videoInfo = response.data.info;
                }, function(){
                    $scope.videosError = 'No pudimos cargar los videos';
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        };

        $scope.canLoadVideos = function(){
            return !!$scope.videoPageToken;
        };

        $scope.refreshImages = function(minId){
            var config = $scope.page.photoFeed;

            if(minId){
                config.minId = minId;
            }

            if(_isLoadingImages) return;

            AnalyticsService.track('refreshImages', {venue: venue.id, minId:  minId});

            _isLoadingImages = true;
            $scope.imagesError = '';

            VenuesService
                .getChannel(config)
                .then(function(data){
                    //Save instagram id for future usage if not present
                    if(!$scope.page.photoFeed.id){
                        $scope.page.photoFeed.id = data.id;

                        VenuesService.updatePage($scope.page.id, 'photoFeed', $scope.page.photoFeed);
                    }

                    if(data && data.results && data.results.length){
                        $scope.socialImages = data.results.concat($scope.socialImages);
                        $scope.firstImage = _.first($scope.socialImages).id;
                    }
                }, function(e){
                    AnalyticsService.track('error', {type: 'refreshImages', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                    _isLoadingImages = false;
                });
        };

        $scope.loadImages = function(maxId){
            var config = $scope.page.photoFeed;

            if(maxId){
                config.maxId = maxId;
            }

            if(_isLoadingImages) return;

            _isLoadingImages = true;
            $scope.imagesError = '';

            VenuesService
                .getChannel(config)
                .then(function(data){
                    //Save instagram id for future usage if not present
                    if(!$scope.page.photoFeed.id){
                        $scope.page.photoFeed.id = data.id;

                        VenuesService.updatePage($scope.page.id, 'photoFeed', $scope.page.photoFeed);
                    }

                    if(data && data.results && data.results.length){
                        $scope.socialImages = data.results.concat($scope.socialImages);
                        $scope.lastImage = _.last($scope.socialImages).id;
                        $scope.firstImage = _.first($scope.socialImages).id;
                        _canLoadImages = true;
                    }else if($scope.socialImages.length){
                        $scope.imagesError = 'No hay mas imagenes para cargar';
                        _canLoadImages = false;
                    }else{
                        $scope.imagesError = 'No encontramos imagenes';
                        _canLoadImages = false;
                    }

                    AnalyticsService.track('loadImages', {type: 'success', venue: venue.id, canLoadMore:  _canLoadImages});
                }, function(e){
                    if($scope.socialImages.length){
                        $scope.imagesError = 'No pudimos cargar las imagenes';
                    }else{
                        $scope.imagesError = 'No encontramos imagenes';
                    }
                    _canLoadImages = false;

                    AnalyticsService.track('error', {type: 'loadImages', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    _isLoadingImages = false;
                });
        };

        var _isLoadingImages = false;
        var _canLoadImages = true;
        $scope.canLoadImages = function(){
            return !_isLoadingImages && _canLoadImages;
        }

        $scope.refreshTwitter = function(minId){
            var config = angular.extend({}, $scope.page.twitter, {type: 'twitter'});

            if(minId){
                config.minId = minId;
            }

            if(_isLoadingTwitter) return;

            AnalyticsService.track('refreshTwitter', {id: venue.id});

            _isLoadingTwitter = true;
            $scope.twitterError = '';

            VenuesService
                .getChannel(config)
                .then(function(response){
                    if(response && response.data && response.data.length){
                        $scope.twitts = response.data.concat($scope.twitts);
                        $scope.firstTweet = _.first($scope.twitts).id;
                    }

                    AnalyticsService.track('refreshTwitter', {type: 'success', venue: venue.id, firstTweet: $scope.firstTweet});
                }, function(e){
                    AnalyticsService.track('error', {type: 'refreshTwitter', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                    _isLoadingTwitter = false;
                });
        };

        $scope.loadTwitter = function(maxId){
            var config = angular.extend({}, $scope.page.twitter, {type: 'twitter'});

            if(maxId){
                config.maxId = maxId;
            }

            if(_isLoadingTwitter) return;

            _isLoadingTwitter = true;
            $scope.twitterError = '';

            VenuesService
                .getChannel(config)
                .then(function(response){
                    if(response && response.data && response.data.length){
                        $scope.twitts = $scope.twitts.concat(response.data);
                        $scope.firstTweet = _.first($scope.twitts).id;
                        $scope.lastTweet = _.last($scope.twitts).id;
                    }else if($scope.twitts.length){
                        $scope.twitterError = 'No hay mas status para cargar';
                        _canLoadTwitter = false;
                    }else{
                        $scope.twitterError = 'No encontramos twitts para cargar';
                        _canLoadTwitter = false;
                    }

                    AnalyticsService.track('loadTwitter', {type: 'success', venue: venue.id, canLoadMore:  _canLoadTwitter, firstTweet: $scope.firstTweet, lastTweet: $scope.lastTweet});

                }, function(e){
                    if($scope.twitts.length){
                        $scope.twitterError = 'No hay mas status para cargar';
                    }else{
                        $scope.twitterError = 'No encontramos twitts para cargar';
                    }
                    _canLoadTwitter = false;

                    AnalyticsService.track('error', {type: 'loadTwitter', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    _isLoadingTwitter = false;
                });
        };

        var _isLoadingTwitter = false;
        var _canLoadTwitter = true;
        $scope.canLoadTwitter = function(){
            return !_isLoadingTwitter && _canLoadTwitter;
        };

        $scope.timeline = [];
        $scope.refreshFacebook = function(){
            var config = angular.extend({}, $scope.page.facebook, {type: 'facebook'});

            if(_isLoadingFacebook) return;

            _isLoadingFacebook = true;
            $scope.facebookError = '';

            VenuesService
                .getChannel(config)
                .then(function(response){
                    $scope.facebookPrev = response.paging.previous || false;
                    $scope.facebookNext = response.paging.next || false;

                    $scope.timeline = response.results;

                    AnalyticsService.track('refreshFacebook', {type: 'success', venue: venue.id});
                }, function(e){
                    if(!timeline.length){
                        $scope.facebookError = 'No pudimos actualizar la pagina :(';
                    }else{
                        $scope.facebookError = 'No pudimos cargar la pagina :(';
                    }

                    AnalyticsService.track('error', {type: 'refreshFacebook', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                    _isLoadingFacebook = false;
                });
        };

        $scope.loadFacebook = function(maxId){
            var config = angular.extend({}, $scope.page.facebook, {type: 'facebook', next: $scope.facebookNext});

            if(_isLoadingFacebook) return;

            _isLoadingFacebook = true;
            $scope.facebookError = '';

            VenuesService
                .getChannel(config)
                .then(function(response){
                    AnalyticsService.track('loadFacebook', {type: 'success', venue: venue.id, facebook:  $scope.page.facebook.id});

                    $scope.facebookPrev = response.paging.previous || false;
                    $scope.facebookNext = response.paging.next || false;

                    if(response && response.results && response.results.length){
                        $scope.timeline = $scope.timeline.concat(response.results);
                    }else if($scope.twitts.length){
                        $scope.facebookError = 'No hay mas status para cargar';
                        _canLoadFacebook = false;
                    }else{
                        $scope.twitterError = 'No encontramos datos para cargar';
                        _canLoadFacebook = false;
                    }

                }, function(e){
                    _canLoadFacebook = false;

                    if(!timeline.length){
                        $scope.facebookError = 'No pudimos cargar la pagina :(';
                    }else{
                        $scope.facebookError = 'No pudimos cargar mas detalles :(';
                    }

                    AnalyticsService.track('error', {type: 'loadFacebook', venue: venue.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    _isLoadingFacebook = false;
                });
        };

        var _isLoadingFacebook = false;
        var _canLoadFacebook = true;
        $scope.canLoadFacebook = function(){
            return !_isLoadingFacebook && _canLoadFacebook;
        };

        $scope.shareFacebook = function(link, venueId) {
            var onShare = function() {
                AnalyticsService.track('shareFacebook', {link:  link, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareFacebook', code:  e.code, message: e.message, venue: venue.id});
            };

            var msg = 'Mira lo que encontre sobre ' + venue.get('name') + ' via #jound';

            $cordovaSocialSharing.share(
                msg,
                null,
                img,
                link
            ).then(onShare, onShareError);
        };

        $scope.playVideo = function(id){
            AnalyticsService.track('playVideo', {venue: venue.id, video: id});

            if(ionic.Platform.isAndroid() && ionic.Platform.version() > 5){
                $scope.openExternalApp('youtube:video', id);
            }else{
                YoutubeVideoPlayer.openVideo(id);
            }
        };

        $scope.openUrl = function(url){
            AnalyticsService.track('openUrl', {venue: venue.id, url: url});

            LinksService.open(url);
        };

        $scope.openExternalApp = function(type, identifier, subIdentifier){
            AnalyticsService.track('openExternalApp', {venue: venue.id, type:  type, identifier:  identifier, subIdentifier:  subIdentifier});
            LinksService.openExternalApp(type, identifier, subIdentifier);
        };

        $scope.aboutUs = function(){
            $state
                .go('app.venueAbout', {inherith:true, venueId: $scope.venue.id})
                .then(function(){}, function(e){
                    AnalyticsService.track('error', {type: 'navigate', page: 'about', code:  e.code, message: e.message, venue: venue.id});
                    $cordovaDialogs.alert('Ha ocurrido un error al cargar los datos, hemos reportado el error, disculpe las molestias.', 'Error', 'OK');
                });
        };

        $scope.products = function(){
            $state
                .go('app.venueProducts', {inherith:true, venueId: $scope.venue.id})
                .then(function(){}, function(e){
                    AnalyticsService.track('error', {type: 'navigate', page: 'products', code:  e.code, message: e.message, venue: venue.id});
                    $cordovaDialogs.alert('Ha ocurrido un error al cargar los datos, hemos reportado el error, disculpe las molestias.', 'Error', 'OK');
                });
        };

        $scope.deals = function(){
            $state
                .go('app.venuePromos', {inherith:true, venueId: $scope.venue.id})
                .then(function(){}, function(e){
                    AnalyticsService.track('error', {type: 'navigate', page: 'deals', code:  e.code, message: e.message, venue: venue.id});
                    $cordovaDialogs.alert('Ha ocurrido un error al cargar los datos, hemos reportado el error, disculpe las molestias.', 'Error', 'OK');
                });
        };

        $scope.reviews = function(){
            $state
                .go('app.venueReviews', {inherith:true, venueId: $scope.venue.id})
                .then(function(){}, function(e){
                    AnalyticsService.track('error', {type: 'navigate', page: 'reviews', code:  e.code, message: e.message, venue: venue.id});
                    $cordovaDialogs.alert('Ha ocurrido un error al cargar los datos, hemos reportado el error, disculpe las molestias.', 'Error', 'OK');
                });
        };

        $scope.events = function(){
            $state
                .go('app.venueEvents', {inherith:true, venueId: $scope.venue.id})
                .then(function(){}, function(e){
                    AnalyticsService.track('error', {type: 'navigate', page: 'events', code:  e.code, message: e.message, venue: venue.id});
                    $cordovaDialogs.alert('Ha ocurrido un error al cargar los datos, hemos reportado el error, disculpe las molestias.', 'Error', 'OK');
                });
        };

        $scope.share = function() {
            var link = AppConfig.HOST_URL + 'venues/' + venue.id;
            var msg = venue.get('name') + ' en ' + venue.getCity() + ' via #jound';
            var hashtags = venue.getTwitterHashtags().join(' ');
            var onShare = function() {
                AnalyticsService.track('share', {link:  link, tags:  hashtags, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'share', code:  e.code, message: e.message, venue: venue.id});
            };

            if(!_.isEmpty(hashtags)){
                msg += ' ' + venue.getTwitterHashtags().join(' ');
            }

            $cordovaSocialSharing.share(
                msg,
                null,
                null,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareInstagram = function(link, img, tags) {
            var msg = 'Cheka esta foto de ' + venue.get('name') + ' via #jound';

            var onShare = function() {
                AnalyticsService.track('shareInstagram', {link:  link, tags:  tags, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareInstagram', code:  e.code, message: e.message, venue: venue.id});
            };

            if(!_.isEmpty(tags)){
                tags = tags.map(function(t){return t.text || t;});
                msg += ' #' + tags.join(' #');
            }

            $cordovaSocialSharing.share(
                msg,
                null,
                img || null,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareTwitter = function(link, img, tags) {
            var msg = 'Mira lo que estan twiteando sobre ' + venue.get('name') + ' via #jound';
            var onShare = function() {
                AnalyticsService.track('shareTwitter', {link:  link, tags:  tags, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareTwitter', code:  e.code, message: e.message, venue: venue.id});
            };

            if(!_.isEmpty(tags)){
                tags = tags.map(function(t){
                    if(_.isString(t)){return t;}
                    else if(t.text){return t.text;}
                });
                msg += ' #' + tags.join(' #');
            }

            $cordovaSocialSharing.share(
                msg,
                null,
                img || null,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareCheckin = function(){
            var msg = 'Hice Check-In en ' + venue.get('name') + ' via #jound';
            var keywords = venue.getTwitterHashtags();
            var link = AppConfig.HOST_URL + 'venues/' + venue.id + '/checkin';

            var onShare = function() {
                AnalyticsService.track('shareCheckin', {venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareCheckin', code:  e.code, message: e.message, venue: venue.id});
            };

            if(!_.isEmpty(keywords)){
                msg += ' ' + keywords.join (' ');
            }

            $cordovaSocialSharing.share(
                msg,
                $scope.venue.getLogo(),
                null,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareVideo = function(link, img, title, venueId) {
            var msg = 'Hey mira el video de ' + $scope.venue.get('name') + ' #jound';
            var hashtags = venue.getTwitterHashtags();
            var onShare = function() {
                AnalyticsService.track('shareVideo', {link:  link, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareVideo', code:  e.code, message: e.message, venue: venue.id});
            };

            if(hashtags){
                msg += ' ' + hashtags.join(' ');
            }

            $cordovaSocialSharing.share(
                msg,
                null,
                null,
                link
            ).then(onShare, onShareError);
        };

        $scope.back = function(){
            $state.go('app.home');
        };

        $scope.checkingLoading = false;

        $scope.checkin = function(){
            if($rootScope.user.isAnonimous()){
                $cordovaDialogs.alert('Esta opcion solo esta disponible para usuarios registrados, no te quedes fuera y crea tu cuenta Jound para usar todas sus caracteristicas');
                return;
            }

            $scope.checkinLoading = true;

            User
                .current()
                .checkIn($scope.venue.id)
                .then(function(response){
                    $scope.isCheckedIn = true;

                    $cordovaDialogs
                        .confirm('¿Deseas compartir tu Check-in?', 'Check-in', ['Si', 'No'])
                        .then(function(buttonIndex) {
                            // no button = 0, 'OK' = 1, 'Cancel' = 2
                            var btnIndex = buttonIndex;
                            switch(btnIndex){
                            case 1:
                                $scope.shareCheckin();
                                break;
                            }
                        });

                    AnalyticsService.track('checkin', {venue: venue.id, user: $rootScope.user.id});
                }, function(e){
                    $scope.isCheckedIn = false;
                    AnalyticsService.track('error', {type: 'checkin', venue: venue.id, user: $rootScope.user.id, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.checkinLoading = false;
                });
        };

        $scope.isCheckedIn = false;
        var _isCheckedIn = function(){
            if($rootScope.user.isAnonimous()){
                return;
            }

            var now = (new Date())*1;
            var sixteenHours = 16*60*60*1000;
            var checkinDate, checkinValidDate;

            $scope.checkinLoading = true;

            User
                .current()
                .checkUserCheckIn($scope.venue.id)
                .then(function(lastCheckin){
                    if(_.isEmpty(lastCheckin)){
                        $scope.isCheckedIn = false;
                    }else{
                        checkinDate = new Date(lastCheckin.createdAt);
                        checkinValidDate = new Date( (checkinDate*1) + sixteenHours);

                        if(now < checkinValidDate*1) {
                            $scope.isCheckedIn = true;
                        }else{
                            $scope.isCheckedIn = false;
                        }
                    }
                }, function(e){
                    $scope.isCheckedIn = false;
                })
                .finally(function(){
                    $scope.checkinLoading = false;
                });
        }

        var _checkClaimed = function(){
            VenuesService
                .isClaimed($scope.venue.id)
                .then(function(claims){
                    $timeout(function(){
                        $scope.$apply(function(){
                            if(claims && claims.length){
                                _isClaimed = true;
                            }else{
                                _isClaimed = false;
                            }
                        })
                    })
                });
        };
        var _isClaimed = false;

        $scope.isClaimed = function(){
            return _isClaimed;
        }

        $ionicModal.fromTemplateUrl('templates/venue/claim.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.claimModal = modal;
        });

        $ionicModal.fromTemplateUrl('templates/venue/bug.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.bugModal = modal;
        });

        $scope.startClaim = function(){
            if($rootScope.user.isAnonimous()){
                $cordovaDialogs.alert('Esta opcion solo esta disponible para usuarios registrados, no te quedes fuera y crea tu cuenta Jound para usar todas sus caracteristicas');
                return
            }

            $scope.claim = angular.copy($scope.claimMaster);
            $scope.claim.comments = 'Hola, me gustaria reclamar el negocio ' + $scope.basicData.name + ' ubicado en ' + $scope.basicData.address + ', ' + $scope.basicData.city;
            $scope.claimModal.show();
        }

        $scope.closeClaim = function(){
            _checkClaimed();
            $scope.claim = angular.copy($scope.claimMaster);
            $scope.claimModal.hide();
        }

        $scope.sendClaim = function(){
            $cordovaProgress.showSimpleWithLabelDetail(true, 'Enviando peticion');

            AnalyticsService.track('claim', {venue: venue.id, user: $rootScope.user.id});

            VenuesService
                .claim(venue.id, $scope.claim)
                .then(function(){
                    $cordovaDialogs.alert('Se ha enviado una solicitud para asignarte el establecimiento en cuestion, gracias por usar Jound', 'Listo');
                }, function(response){
                    var e = response.data.error;

                    switch(e.code){
                    case 405:
                        e.message = 'Ese establecimiento ya ha sido reclamado';
                    }

                    $cordovaDialogs.alert(e.message || 'Ha ocurrido un error, intenta de nuevo', 'Error');
                })
                .finally(function(){
                    $cordovaProgress.hide();
                    $scope.closeClaim();
                })
        };

        $scope.reportBug = function(){
            if($rootScope.user.isAnonimous()){
                $cordovaDialogs.alert('Esta opcion solo esta disponible para usuarios registrados, no te quedes fuera y crea tu cuenta Jound para usar todas sus caracteristicas');
                return;
            }

            $scope.bug = angular.copy($scope.bugMaster);
            $scope.bugModal.show();
        }

        $scope.closeBug = function(){
            $scope.bug = angular.copy($scope.bugMaster);
            $scope.bugModal.hide();
        }

        $scope.sendBug = function(){
            $cordovaProgress.showSimpleWithLabelDetail(true, 'Enviando Reporte');

            AnalyticsService.track('bug', {venue: venue.id, type: $scope.bug.problemType, user: $rootScope.user.id});

            VenuesService
                .report(venue.id, $scope.bug.comments, $scope.bug.problemType)
                .then(function(){
                    $cordovaDialogs.alert('Gracias por su reporte, es un placer atenderle', 'Listo');
                }, function(e){
                    $cordovaDialogs.alert(e.message || 'Ha ocurrido un error, intenta de nuevo', 'Error');
                })
                .finally(function(){
                    $cordovaProgress.hide();
                    $scope.closeBug();
                })
        };

        $scope.currentFSImage = undefined;
        //Create fullscreen image modal
        $ionicModal.fromTemplateUrl('templates/fsmodal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.fullScreenModal = modal;
        });

        $ionicModal.fromTemplateUrl('templates/fspreviewmodal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.fullScreenPreviewModal = modal;
        });

        $scope.openImage = function(url, index){
            $scope.currentFSImage = url;
            $scope.openFSModal();
        };

        $scope.openBusinessImage = function(data){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.businessImageSRC = data;
                    $cordovaProgress.hide();
                });
            });

            $scope.openFSImagePreviewModal();
        }

        $scope.openFSModal = function() {
            $scope.fullScreenModal.show();
        };

        $scope.openFSImagePreviewModal = function(){
            $scope.fullScreenPreviewModal.show();
        };

        $scope.closeFSModal = function() {
            $scope.fullScreenModal.hide();
            $scope.businessImageSRC = '';
        };

        $scope.closeFSImagePreviewModal = function(){
            $scope.fullScreenPreviewModal.hide();
        };

        $scope.openSlideshow = function(index){
            var message = 'Desliza hacia abajo para cerrar';
            $scope.activeSlide = index;

            if(!$scope.fullScreenSlideshowModal){
                $ionicModal.fromTemplateUrl('templates/fsslideshowmodal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    $scope.fullScreenSlideshowModal = modal;
                    $scope.fullScreenSlideshowModal.show();

                    $cordovaToast.showLongBottom(message)
                });
            }else{
                $scope.fullScreenSlideshowModal.show();
                $cordovaToast.showLongBottom(message)
            }
        }

        $scope.closeSlideshow = function(){
            if($scope.fullScreenSlideshowModal){
                $scope.fullScreenSlideshowModal.hide();
                $scope.fullScreenSlideshowModal.remove();
                $scope.fullScreenSlideshowModal = null;
            }
        }

        $scope.updateSlideStatus = function(slide) {
            var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;

            if (zoomFactor == $scope.zoomMin) {
                $timeout(function(){
                    $scope.$apply(function(){
                        $ionicSlideBoxDelegate.enableSlide(true);
                    });
                });
            } else {
                $timeout(function(){
                    $scope.$apply(function(){
                        $ionicSlideBoxDelegate.enableSlide(false);
                    });
                });
            }
        };

        $scope.businessImageSRC = '';
        $scope.takePhoto = function(){
            if($rootScope.user.isAnonimous()){
                $cordovaDialogs.alert('Esta opcion solo esta disponible para usuarios registrados, no te quedes fuera y crea tu cuenta Jound para usar todas sus caracteristicas');
                return;
            }

            $scope.businessImageSRC = '';

            CameraService
                .ready()
                .then(function(){
                    CameraService
                        .take({targetWidth:720, targetHeight: 400})
                        .then(function(image){
                            $cordovaProgress.showSimpleWithLabelDetail(true, 'Guardando imagen', 'Esperen un segundo');
                            //Save photo
                            VenuesService
                                .savePhotoForVenue(image, $scope.venue.id)
                                .then(function(url){
                                    $scope.images.push({url: url});
                                    $scope.venue.addUnique('images', url);

                                    $cordovaProgress.hide();

                                    $timeout(function(){
                                        $cordovaToast.showShortBottom('Imagen guardada, gracias :)');
                                    });

                                    AnalyticsService.track('imageSavedForVenue', {venue: venue.id, image: url});
                                }, function(e){
                                    AnalyticsService.track('error', {venue: venue.id, code:  e.code, message: e.message});

                                    $cordovaProgress.hide();

                                    $timeout(function(){
                                        $cordovaDialogs.alert(e.message);
                                    });
                                });
                        }, function(e){
                            AnalyticsService.track('error', {venue: venue.id, code:  e.code, message: e.message});
                        });
                });
        };

        $scope.$on('$ionicView.enter', function(){
            _isCheckedIn();
            _checkClaimed();

            if($scope.swiper){
                return;
            }

            $scope.swiper = new Swiper('.swiper-container', {
                pagination: '.swiper-pagination',
                paginationClickable: true,
                observer: true
            });
        });

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenueAboutCtrl', function($scope, $state, $sce, $ionicHistory, $ionicPlatform, $cordovaSplashscreen, $stateParams, venue, VenuesService, AnalyticsService, AppConfig, $cordovaSocialSharing){
        VenuesService.current(venue);

        $scope.basicData = venue.getBasicData();
        $scope.text = $sce.trustAsHtml(venue.get('page').get('about'));
        $scope.name = venue.get('name');
        $scope.venueId = $stateParams.venueId;

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        }

        $scope.share = function(){
            var link = AppConfig.HOST_URL + '/venues/' + venue.id + '/about';
            var msg = 'Acerca de ' + venue.get('name') + ' #jound';

            var onShare = function() {
                AnalyticsService.track('shareAbout', {link:  link, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareAbout', code:  e.code, message: e.message, venue: venue.id});
            };

            $cordovaSocialSharing.share(
                msg,
                null,
                null,
                link
            ).then(onShare, onShareError);
        };

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenuePromosCtrl', function($scope, $state, $timeout, $stateParams, $ionicSlideBoxDelegate, $ionicPlatform, $cordovaSocialSharing, $cordovaSplashscreen, $ionicHistory, VenuesService, LinksService, venue, AnalyticsService, AppConfig){
        var _canLoadMore = false;
        var _pageSize = 20;

        VenuesService.current(venue);

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');
        $scope.loading = true;

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        };

        $scope.loadItems = function(id, skip){
            VenuesService
                .getDealsForVenue(id, skip)
                .then(function(items){
                    if(items.length < $scope.pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        $scope.skip = _pageSize;
                    }

                    $scope.items = items;

                    if(!_.isEmpty($scope.items)){
                        $timeout(function(){
                            $scope.$apply(function(){
                                $ionicSlideBoxDelegate.$getByHandle('venuePromoHandle').update();
                            });
                        });

                        if($scope.items.length > 1){
                            $scope.items.filter(function(e, i){
                                if(e.objectId === $stateParams.promoId){
                                    $timeout(function(){
                                        $scope.$apply(function(){
                                            $ionicSlideBoxDelegate.$getByHandle('venuePromoHandle').slide(i);
                                        });
                                    }, 1000);
                                }
                            });
                        }
                    }
                }, function(e){
                    //console.log('deals error', arguments);
                    _canLoadMore = false;
                    AnalyticsService.track('error', {type: 'loadPromoItems', venue: $scope.venueId, code:  e.code, message:  e.message});
                })
                .finally(function(){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.loading = false;
                        });
                    });
                });
        }

        $scope.openUrl = function(url){
            LinksService.open(url);
            AnalyticsService.track('openPromoURL', {venue: $scope.venueId, url: url});
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.share = function() {
            var index = $ionicSlideBoxDelegate.$getByHandle('venuePromoHandle').currentIndex();
            var promo = $scope.items[index];
            var link = AppConfig.HOST_URL + 'venues/' + $scope.venueId + '/promos/' + promo.objectId;
            var msg = 'Promocion: ' + promo.name || promo.description + ' de ' + venue.get('name') + ' que encontre via #jound';

            $cordovaSocialSharing
                .share(msg, null, null, link)
                .then(function(){
                    AnalyticsService.track('sharePromo', {venue: $scope.venueId, url: link});
                }, function(e){
                    AnalyticsService.track('error', {type: 'sharePromo', venue: $scope.venueId, code:  e.code, message:  e.message, url: link});
                });
        };

        $scope.$on('$ionicView.enter', function() {
            $scope.loadItems($scope.venueId);
        });

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenueEventsCtrl', function($scope, $state, $timeout, $stateParams, $ionicSlideBoxDelegate, $cordovaSocialSharing, $cordovaSplashscreen, $ionicHistory, $ionicPlatform, VenuesService, LinksService, venue, AnalyticsService, AppConfig){
        var _canLoadMore = false;
        var _pageSize = 20;

        VenuesService.current(venue);

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');
        $scope.loading = true;
        $scope.activeSlide = 0;

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        };

        $scope.loadItems = function(id, skip){
            VenuesService
                .getEventsForVenue(id, skip)
                .then(function(items){
                    if(items.length < $scope.pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        $scope.skip = _pageSize;
                    }

                    $scope.items = items;

                    AnalyticsService.track('loadEventItems', {venue: $scope.venueId, count:  items.length});

                    if(!_.isEmpty($scope.items)){
                        $timeout(function(){
                            $scope.$apply(function(){
                                $ionicSlideBoxDelegate.$getByHandle('venueEventHandle').update();
                            });
                        });

                        if($scope.items.length > 1){
                            $scope.items.filter(function(e, i){
                                if(e.objectId === $stateParams.eventId){
                                    $timeout(function(){
                                        $scope.$apply(function(){
                                            $ionicSlideBoxDelegate.$getByHandle('venueEventHandle').slide(i);
                                        });
                                    }, 1000);
                                }
                            });
                        }
                    }
                }, function(){
                    //console.log('deals error', arguments);
                    _canLoadMore = false;
                    AnalyticsService.track('error', {type: 'loadEventItems', venue: $scope.venueId, code:  e.code, message:  e.message});
                })
                .finally(function(){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.loading = false;
                        });
                    });
                });
        }

        $scope.openUrl = function(url){
            LinksService.open(url);
            AnalyticsService.track('openEventURL', {venue: $scope.venueId, url: url});
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.share = function() {
            var index = $ionicSlideBoxDelegate.$getByHandle('venueEventHandle').currentIndex();
            var e = $scope.items[index];
            var msg = e.title ? e.title + ' evento de ' + venue.get('name') + ' via #jound' : 'Hey mira el evento de ' + venue.get('name') + ' que encontre via #jound';
            var link = AppConfig.HOST_URL + 'venues/' + $scope.venueId + '/events/' + e.objectId;

            $cordovaSocialSharing
                .share(msg, null, null, link)
                .then(function(){
                    AnalyticsService.track('shareEvent', {venue: $scope.venueId, url: link});
                }, function(e){
                    AnalyticsService.track('error', {type: 'shareEvent', venue: $scope.venueId, code:  e.code, message:  e.message, url: link});
                });
        };

        $scope.$on('$ionicView.enter', function() {
            $scope.loadItems($scope.venueId);
        });

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenueProductsCtrl', function($scope, $state, $timeout, $stateParams, $ionicHistory, $ionicModal, $ionicPlatform, $cordovaDialogs, $cordovaSplashscreen, $ionicLoading, VenuesService, venue, AnalyticsService, AppConfig, $cordovaSocialSharing, $cordovaProgress){
        var _canLoadMore = true;
        var _pageSize = 20;
        var _page = 0;

        VenuesService.current(venue);

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');
        $scope.loading = true;

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        };

        $scope.loadItems = function(id, skip){
            VenuesService
                .getProductsForVenue(id, skip, _pageSize)
                .then(function(items){
                    if(items.length < _pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        _page++;
                        $scope.skip = (_pageSize*_page)+1;
                    }

                    $scope.items = $scope.items.concat(items);
                    AnalyticsService.track('loadProductItems', {venue: $scope.venueId, count:  items.length});
                }, function(e){
                    _canLoadMore = false;
                    AnalyticsService.track('error', {type: 'loadProductItems', venue: $scope.venueId, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.loading = false;
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        });
                    });
                });
        }

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.openProduct = function(item){
            $cordovaProgress.showSimple(true);

            $state
                .go('app.venueProduct', {venueId: venue.id, productId: item.objectId})
                .then(function(){
                    AnalyticsService.track('openProduct', {venue: $scope.venueId, id: item.objectId});
                }, function(e){
                    AnalyticsService.track('error', {type: 'openProduct', venue: $scope.venueId, id: item.objectId});

                    var msg = 'Ha ocurrido un error, lo reportaremos de inmediato, disculpa las inconveniencias.';
                    if(e.code === 404){
                        msg = 'Parece que ese producto no existe, lo reportaremos al establecimiento, disculpa las inconveniencias.';
                    }

                    $cordovaDialogs.alert(msg, 'Error', 'Entendido');
                })
                .finally(function(){
                    $cordovaProgress.hide();
                });
        };

        $scope.share = function() {
            var link = AppConfig.HOST_URL + 'venues/' + $scope.venueId + '/products';
            var msg = 'Productos de ' + venue.get('name') + ' via #jound';

            $cordovaSocialSharing
                .share(msg, null, null, link)
                .then(function(){
                    AnalyticsService.track('shareProducts', {venue: $scope.venueId, url: link});
                }, function(e){
                    AnalyticsService.track('error', {type: 'shareProducts', venue: $scope.venueId, code:  e.code, message:  e.message, url: link});
                });
        };

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenueProductCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicPlatform, $cordovaDialogs, $cordovaSplashscreen, VenuesService, productData, AnalyticsService, AppConfig, $cordovaSocialSharing){
        $scope.item = productData.product;
        $scope.venue = VenuesService.current(VenuesService.convertToParseObject(productData.venue));
        $scope.venueId = $stateParams.venueId;

        $scope.back = function(){
            $state.go('app.venueProducts', {venueId: $stateParams.venueId});
        };

        $scope.share = function() {
            var link = AppConfig.HOST_URL + 'venues/' + $stateParams.venueId + '/products/' + $scope.item.objectId;
            var msg = $scope.item.name + ' de ' + $scope.venue.get('name') + ' via #jound';

            $cordovaSocialSharing
                .share(msg, null, null, link)
                .then(function(){
                    AnalyticsService.track('shareProduct', {venue: $scope.venueId, url: link, product: $scope.item.id});
                }, function(e){
                    AnalyticsService.track('error', {type: 'shareProduct', venue: $scope.venue.id, code:  e.code, message:  e.message, url: link, product: $scope.item.id});
                });
        };

        $scope.order = function(){
            $cordovaDialogs.alert('Estamos trabajando en las herramientas para que puedas ordenar productos desde tu dispositivo.');
        };

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    })
    .controller('VenueReviewsCtrl', function($scope, $state, $rootScope, $stateParams, $ionicPlatform, $cordovaProgress, $cordovaSplashscreen, $cordovaDialogs, $ionicHistory, VenuesService, User, venue, AnalyticsService, $cordovaSocialSharing, AppConfig){
        var _canLoadMore = true;
        var _pageSize = 20;
        var _page = 0;

        if($rootScope.user.isAnonimous()){
            $cordovaDialogs.alert('De momento las reseñas solo pueden ser creados por usuarios registrados, no te quedes fuera y crea tu cuenta Jound para usar todas sus caracteristicas');
        }

        VenuesService.current(venue);

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.noReviews = false;
        $scope.rating = 0;
        $scope.max = 5;
        $scope.reviewText = '';
        $scope.userId = $rootScope.user.id;
        $scope.name = venue.get('name');

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        };

        $scope.loadItems = function(id, skip){
            var sinceDate;
            var maxDate;

            if($scope.items.length){
                maxDate = _.last($scope.items).createdAt;
            }

            VenuesService
                .getReviewsForVenue(id, skip, _pageSize, null, maxDate)
                .then(function(items){
                    if(items.length < _pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        _page++;
                        $scope.skip = (_pageSize*_page)+1;
                        $scope.noReviews = false;
                    }

                    $scope.items = $scope.items.concat(items.map(function(i){
                        var at = (new Date(i.createdAt));
                        i.displayDate = at.toLocaleDateString() + ' @ ' + at.toLocaleTimeString();
                        return i;
                    }));

                    if(!$scope.items.length) {
                        $scope.noReviews = true;
                    }

                    AnalyticsService.track('loadReviewItems', {venue: $scope.venueId, count:  items.length});
                }, function(e){
                    //console.log('error loading comments', arguments);
                    _canLoadMore = false;
                    AnalyticsService.track('error', {type: 'loadReviewItems', venue: $scope.venueId, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }

        $scope.refreshItems = function(id){
            var sinceDate;

            if($scope.items.length){
                sinceDate = _.first($scope.items).createdAt;
            }

            VenuesService
                .getReviewsForVenue(id, 0, _pageSize, sinceDate)
                .then(function(items){
                    if(items.length){
                        $scope.noReviews = false;
                        $scope.items = items.concat($scope.items);
                    }else if(!$scope.items.length){
                        $scope.noReviews = true;
                    }

                    AnalyticsService.track('refreshReviewItems', {venue: $scope.venueId, count:  items.length});
                }, function(e){
                    //console.log(arguments, 'error refreshing comments');
                    AnalyticsService.track('error', {type: 'refreshReviewItems', venue: $scope.venueId, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        }

        $scope.canReview = function(){
            var id = $rootScope.user.id;
            var hasReviewed = _.find($scope.items, function(i){
                return i.author.objectId === id;
            });

            return !_.isEmpty(hasReviewed);
        }

        $scope.saveReview = function(text, rating){
            $cordovaProgress.showSimpleWithLabelDetail(true, 'Guardando', 'Esperen un segundo');

            VenuesService
                .saveReview($scope.venueId, text, $rootScope.user.id, rating)
                .then(function(comment){
                    if(comment){
                        var at = (new Date(comment.createdAt));
                        comment.author = $rootScope.user.toJSON();
                        comment.author.avatar = $rootScope.user.getAvatar();
                        comment.venue = VenuesService.current();
                        comment.displayDate = at.toLocaleDateString() + ' @ ' + at.toLocaleTimeString();
                        $scope.items = [comment].concat($scope.items);
                        $scope.noReviews = false;

                        AnalyticsService.track('saveReview', {venue: $scope.venueId, user: $rootScope.user.id, type: 'success'});
                    }
                }, function(e){
                    AnalyticsService.track('error', {type: 'saveReview', venue: $scope.venueId, code:  e.code, message: e.message});
                })
                .finally(function(){
                    $scope.rating = 0;
                    $scope.reviewText = '';
                    $cordovaProgress.hide();
                });
        }

        $scope.share = function(){
            var link = AppConfig.HOST_URL + 'venues/' + venue.id + '/reviews';
            var msg = 'Mira lo que estan diciendo de ' + venue.get('name') + ' en #jound';

            var onShare = function() {
                AnalyticsService.track('shareReviews', {link:  link, venue: venue.id});
            };
            var onShareError = function(e) {
                AnalyticsService.track('error', {type: 'shareReviews', code:  e.code, message: e.message, venue: venue.id});
            };

            $cordovaSocialSharing.share(
                msg,
                null,
                null,
                link
            ).then(onShare, onShareError);
        };

        $ionicPlatform.ready(function(){
            $cordovaSplashscreen.hide();
        });
    });
