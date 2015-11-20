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
        $stateParams,
        $timeout,
        $cordovaInAppBrowser,
        $state,
        $cordovaSocialSharing,
        $ionicModal,
        $ionicHistory,
        $cordovaDialogs,
        $cordovaProgress,
        VenuesService,
        LinksService,
        CameraService,
        venue,
        User
    ) {
        $scope.venue = venue;
        $scope.basicData = venue.getBasicData();
        $scope.logo = venue.getLogo();
        $scope.images = [];
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

        if (venue.get('images') && venue.get('images').length) {
            $timeout(function() {
                $scope.$apply(function() {
                    $scope.images.push($scope.logo);
                    $scope.images = $scope.images.concat(venue.get('images'));
                });
            })
        }else{
            $timeout(function() {
                $scope.$apply(function() {
                    $scope.images.push($scope.logo);
                });
            })
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
                }, function(){
                    if($scope.socialImages.length){
                        $scope.imagesError = 'No pudimos cargar las imagenes';
                    }else{
                        $scope.imagesError = 'No encontramos imagenes';
                    }
                    _canLoadImages = false;
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
            var config = angular.extend({}, $scope.page.twitter, {type: 'twitterrr'});

            if(minId){
                config.minId = minId;
            }

            if(_isLoadingTwitter) return;

            _isLoadingTwitter = true;
            $scope.twitterError = '';

            VenuesService
                .getChannel(config)
                .then(function(response){
                    if(response && response.data && response.data.length){
                        $scope.twitts = response.data.concat($scope.twitts);
                        $scope.firstTweet = _.first($scope.twitts).id;
                    }   
                }, function(e){
                    
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

                }, function(e){
                    if($scope.twitts.length){
                        $scope.twitterError = 'No hay mas status para cargar';
                    }else{
                        $scope.twitterError = 'No encontramos twitts para cargar';
                    }
                    _canLoadTwitter = false;
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

        $scope.playVideo = function(id){
            if(ionic.Platform.isAndroid() && ionic.Platform.version() > 5){
                $scope.openExternalApp('youtube:video', id);
            }else{
                YoutubeVideoPlayer.openVideo(id);
            }
        };

        $scope.openUrl = function(url){
            LinksService.open(url);
        };

        $scope.openExternalApp = function(type, identifier, subIdentifier){
            LinksService.openExternalApp(type, identifier, subIdentifier);
        };

        $scope.aboutUs = function(){
            $state.go('app.venueAbout', {inherith:true, venueId: $scope.venue.id});
        };

        $scope.products = function(){
            $state.go('app.venueProducts', {inherith:true, venueId: $scope.venue.id});
        };

        $scope.deals = function(){
            $state.go('app.venuePromos', {inherith:true, venueId: $scope.venue.id});
        };

        $scope.reviews = function(){
            $state.go('app.venueReviews', {inherith:true, venueId: $scope.venue.id});
        };

        $scope.events = function(){
            $state.go('app.venueEvents', {inherith:true, venueId: $scope.venue.id});
        };

        $scope.share = function(link, img, tags, venueId) {
            var onShare = function() {
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };

            if(tags){
                tags = tags.map(function(t){return t.text || t;});
            }else{
                tags = [];
            }

            var msg = 'Hey mira lo que encontre via #jound http://www.jound.mx/venue/' + venueId + ' ' + tags.join(' #');

            $cordovaSocialSharing.share(
                msg,
                'Hey mira lo que encontre en #jound',
                img,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareCheckin = function(){
            var onShare = function() {
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };
            var tags = $scope.venue.get('keywords').map(function(t){return t;});
            var link = 'http://www.jound.mx/venue/' + $scope.venue.id;

            $cordovaSocialSharing.share(
                'Hice Check-In en ' + $scope.venue.get('name') + '#' + $scope.venue.getCityName() + ' via #jound ' + tags.join(' #'),
                $scope.venue.getLogo(),
                null,
                link
            ).then(onShare, onShareError);
        };

        $scope.shareVideo = function(link, img, title, venueId) {
            var onShare = function() {
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };

            var msg = 'Hey mira lo que encontre via #jound http://www.jound.mx/venue/' + venueId;

            $cordovaSocialSharing.share(
                msg,
                'Hey mira lo que encontre en #jound (' + title + ')',
                img,
                link
            ).then(onShare, onShareError);
        };


        $scope.back = function(){
            $state.go('app.home');

            //console.log($stateParams, $ionicHistory, 'state params in venue');
        }

        $scope.checkingLoading = false;

        $scope.checkin = function(){
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
                }, function(e){
                    $scope.isCheckedIn = false;
                })
                .finally(function(){
                    $scope.checkinLoading = false;
                });
        };

        $scope.isCheckedIn = false;
        var _isCheckedIn = function(){
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
            $scope.bug = angular.copy($scope.bugMaster);
            $scope.bugModal.show();
        }

        $scope.closeBug = function(){
            $scope.bug = angular.copy($scope.bugMaster);
            $scope.bugModal.hide();
        }

        $scope.sendBug = function(){
            $cordovaProgress.showSimpleWithLabelDetail(true, 'Enviando Reporte');

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

        $scope.openImage = function(url){
            $scope.currentFSImage = url;
            $scope.openFSModal();
        };

        $scope.openFSModal = function() {
            $scope.fullScreenModal.show();
        };

        $scope.closeFSModal = function() {
            $scope.fullScreenModal.hide();
        };

        $scope.businessImageSRC = '';
        $scope.takePhoto = function(){
            CameraService
                .ready()
                .then(function(){
                    CameraService
                        .take()
                        .then(function(image){
                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.businessImageSRC = image;
                                });
                            });
                        }, function(e){
                            console.log(e, 'error on getting image');
                        });
                });
        };

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.fullScreenModal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hide', function() {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
            // Execute action
        });
        $scope.$on('modal.shown', function() {
            //console.log('Modal is shown!');
        });

        $scope.$on('$ionicView.enter', function(){
            _isCheckedIn();
            _checkClaimed();
        });
    })
    .controller('VenueAboutCtrl', function($scope, $state, $sce, $ionicHistory, $stateParams, venue){
        $scope.basicData = venue.getBasicData();
        $scope.text = $sce.trustAsHtml(venue.get('page').get('about'));
        $scope.name = venue.get('name');
        $scope.venueId = $stateParams.venueId;

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        }
    })
    .controller('VenuePromosCtrl', function($scope, $state, $timeout, $stateParams, $ionicSlideBoxDelegate, $cordovaSocialSharing, $ionicHistory, VenuesService, LinksService, venue){
        var _canLoadMore = false;
        var _pageSize = 20;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');
        $scope.loading = true;

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
                    $ionicSlideBoxDelegate.update();
                }, function(){
                    //console.log('deals error', arguments);
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
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.share = function() {
            var index = $ionicSlideBoxDelegate.currentIndex();
            var promo = $scope.items[index];
            var img = promo.bannerUrl ? promo.bannerUrl : promo.file && promo.file.url;
            var link = 'http://www.jound.mx/venue/' + $scope.venueId + '/promo/' + promo.objectId;
            var msg = 'Hey mira la promo que encontre via #jound';

            $cordovaSocialSharing.share(msg, null, img, link);
        };

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        }

        $scope.$on('$ionicView.enter', function() {
            $scope.loadItems($scope.venueId);
        });
    })
    .controller('VenueEventsCtrl', function($scope, $state, $timeout, $stateParams, $ionicSlideBoxDelegate, $cordovaSocialSharing, $ionicHistory, VenuesService, LinksService, venue){
        var _canLoadMore = false;
        var _pageSize = 20;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');
        $scope.loading = true;

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
                    $ionicSlideBoxDelegate.update();
                }, function(){
                    //console.log('deals error', arguments);
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
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.share = function() {
            var index = $ionicSlideBoxDelegate.currentIndex();
            var e = $scope.items[index];
            var msg = 'Hey mira el evento que encontre via #jound';
            var img = e.bannerUrl ? e.bannerUrl : e.banner && e.banner.url;
            var link = 'http://www.jound.mx/venue/' + $scope.venueId + '/event/' + e.objectId;

            $cordovaSocialSharing.share(msg, null, img, link);
        };

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        }

        $scope.$on('$ionicView.enter', function() {
            $scope.loadItems($scope.venueId);
        });
    })
    .controller('VenueProductsCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicModal, VenuesService, venue){
        var _canLoadMore = true;
        var _pageSize = 20;
        var _page = 0;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.name = venue.get('name');

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
                }, function(){
                    //console.log('products error', arguments);
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }

        $scope.canLoad = function(){
            return _canLoadMore;
        };

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        };

        $scope.currentFSImage = undefined;
        //Create fullscreen image modal
        $ionicModal.fromTemplateUrl('templates/fsmodal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.fullScreenModal = modal;
        });

        $scope.openImage = function(url){
            $scope.currentFSImage = url;
            $scope.openFSModal();
        };

        $scope.openFSModal = function() {
            $scope.fullScreenModal.show();
        };

        $scope.closeFSModal = function() {
            $scope.fullScreenModal.hide();
        };
    })
    .controller('VenueReviewsCtrl', function($scope, $stateParams, $state, $cordovaProgress, $ionicHistory, VenuesService, User, venue){
        var _canLoadMore = true;
        var _pageSize = 20;
        var _page = 0;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];
        $scope.noReviews = false;
        $scope.rating = 0;
        $scope.max = 5;
        $scope.reviewText = '';
        $scope.userId = User.current().id;
        $scope.name = venue.get('name');

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
                }, function(){
                    //console.log('error loading comments', arguments);
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
                }, function(e){
                    //console.log(arguments, 'error refreshing comments');
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        $scope.canLoad = function(){
            return _canLoadMore;
        }

        $scope.canReview = function(){
            var id = User.current().id;
            var hasReviewed = _.find($scope.items, function(i){
                return i.author.objectId === id;
            });

            return !_.isEmpty(hasReviewed);
        }

        $scope.canReply = function(){

        }

        $scope.saveReview = function(text, rating){
            $cordovaProgress.showSimpleWithLabelDetail(true, 'Guardando', 'Esperen un segundo');

            VenuesService
                .saveReview($scope.venueId, text, User.current().id, rating)
                .then(function(comment){
                    if(comment){
                        var at = (new Date(comment.createdAt));
                        comment.author = User.current().toJSON();
                        comment.author.avatar = User.current().getAvatar();
                        comment.venue = VenuesService.current();
                        comment.displayDate = at.toLocaleDateString() + ' @ ' + at.toLocaleTimeString();
                        $scope.items = [comment].concat($scope.items);
                        $scope.noReviews = false;
                    }
                }, function(e){
                    //console.log('error saving rewview', arguments);
                })
                .finally(function(){
                    $scope.rating = 0;
                    $scope.reviewText = '';
                    $cordovaProgress.hide();
                })
        }

        $scope.back = function(){
            $state.go('app.venue', {venueId: $scope.venueId});
        }
    });