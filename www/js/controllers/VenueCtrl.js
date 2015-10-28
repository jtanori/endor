angular
    .module('jound.controllers')
    .controller('VenueCtrl', function(
        $scope,
        $rootScope,
        $timeout,
        $cordovaInAppBrowser,
        $state,
        $cordovaSocialSharing,
        $ionicModal,
        VenuesService,
        LinksService,
        venue
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

        $scope.refreshImages = function(maxId, minId){
            var config = $scope.page.photoFeed;

            if(minId){
                config.minId = minId;
            }

            if(maxId){
                config.maxId = maxId;
            }

            console.log('load instagram', config);

            VenuesService
                .getChannel(config)
                .then(function(data){
                    //Save instagram id for future usage if not present
                    if(!$scope.page.photoFeed.id){
                        $scope.page.id = data.id;
                        venue.get('page').save('photoFeed', $scope.page);
                    }
                    //Pass to images
                    if(minId){
                        $scope.socialImages = data.results.concat($scope.socialImages);
                    }else{
                        $scope.socialImages = $scope.socialImages.concat(data.results);
                    }

                    $scope.lastImage = _.last($scope.socialImages).id;
                    $scope.firstImage = _.first($scope.socialImages).id;

                    console.log($scope.socialImages, 'social images', $scope.lastImage, $scope.firstImage);
                }, function(){
                    $scope.imagesError = 'No pudimos cargar las imagenes';
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        };

        $scope.refreshTwitter = function(maxId, minId){
            var config = angular.extend({}, $scope.page.twitter, {type: 'twitter'});

            if(minId){
                config.minId = minId;
            }

            if(maxId){
                config.maxId = maxId;
            }

            VenuesService
                .getChannel(config)
                .then(function(response){
                    if(minId){
                        $scope.twitts = response.data.concat($scope.twitts);
                    }else{
                        $scope.twitts = $scope.twitts.concat(response.data);
                    }

                    console.log($scope.twitts, 'twitts', _.first($scope.twitts), _.last($scope.twitts));
                    
                    $scope.firstTweet = _.first($scope.twitts).id;
                    $scope.lastTweet = _.last($scope.twitts).id;
                }, function(e){
                    $scope.twitterError = 'No pudimos cargar los tweets';
                })
                .finally(function(){
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        };

        $scope.playVideo = function(id){
            if(ionic.Platform.isAndroid() && ionic.Platform.version() > 5){
                $cordovaInAppBrowser.open('https://www.youtube.com/embed/' + id, '_blank');
            }else{
                YoutubeVideoPlayer.openVideo(id);
            }
        };

        $scope.openUrl = function(url){
            LinksService.open(url);
        };

        $scope.openExternalApp = function(type, identifier, subIdentifier){
            console.log('open external app', type, identifier, subIdentifier);
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

        $scope.share = function(link, img, tags, venueId) {

            var onShare = function() {
                console.log('shared', arguments);
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                console.log('not shared', arguments);
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };

            var msg = 'Hey mira lo que encontre via #jound http://www.jound.mx/venue/' + venueId + ' ' + tags.join(' #');

            console.log(msg, img, link);

            $cordovaSocialSharing.share(
                msg,
                'Mira lo que encontre en Jound',
                img,
                link
            ).then(onShare, onShareError);
        };

        $timeout(function(){
            $scope.$apply(function(){
                $scope.twitter = $scope.page.twitter ? $scope.page.twitter.account : false;
                $scope.instagram = $scope.page.photoFeed && $scope.page.photoFeed.type === 'instagram' ? $scope.page.photoFeed.account : false;
                $scope.facebook = $scope.page.facebook && $scope.page.facebook.id ? $scope.page.facebook.id : false;
                $scope.pinterest = $scope.page.pinterest ? $scope.page.pinterest.account : false;
                $scope.youtube = $scope.page.videoFeed ? $scope.page.videoFeed.account : false;
            });
        });


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

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.fullScreenModal.remove();
        });
        // Execute action on hide modal
        $scope.$on('fullScreenModal.hide', function() {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('fullScreenModal.removed', function() {
            // Execute action
        });
        $scope.$on('fullScreenModal.shown', function() {
            console.log('Modal is shown!');
        });
    })
    .controller('VenueAboutCtrl', function($scope, $sce, venue){
        $scope.basicData = venue.getBasicData();
        $scope.text = $sce.trustAsHtml(venue.get('page').get('about'));
    })
    .controller('VenuePromosCtrl', function($scope, $stateParams, $ionicSlideBoxDelegate, $cordovaSocialSharing, VenuesService, LinksService){
        console.log($stateParams);

        var _canLoadMore = false;
        var _pageSize = 20;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];

        $scope.loadItems = function(id, skip){
            VenuesService
                .getDealsForVenue(id, skip)
                .then(function(items){
                    console.log('promos', items);
                    if(items.length < $scope.pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        $scope.skip = _pageSize;
                    }

                    $scope.items = items;
                    $ionicSlideBoxDelegate.update();
                }, function(){
                    console.log('deals error', arguments);
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
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
            
            var onShare = function() {
                console.log('shared', arguments);
                //$cordovaDialogs.alert('Gracias por compartir :)', '!Hey!', 'De nada');
            };
            var onShareError = function() {
                console.log('not shared', arguments);
                //$cordovaDialogs.alert('Ha ocurrido un error al compartir, por favor intenta de nuevo', 'Error', 'Ok');
            };

            var msg = 'Hey mira lo que encontre via #jound http://www.jound.mx/venue/' + $scope.venueId;

            $cordovaSocialSharing.share(
                msg,
                'Mira lo que encontre en Jound',
                promo.bannerUrl ? promo.bannerUrl : promo.file && promo.file.url,
                'http://www.jound.mx/promos/' + promo.objectId
            ).then(onShare, onShareError);
        };

        $scope.$on('$ionicView.enter', function() {
            $scope.loadItems($scope.venueId);
        });
    })
    .controller('VenueProductsCtrl', function($scope, $stateParams, VenuesService){
        console.log($stateParams);

        var _canLoadMore = true;
        var _pageSize = 20;
        var _page = 0;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];


        $scope.loadItems = function(id, skip){
            VenuesService
                .getProductsForVenue(id, skip)
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
                    console.log('products error', arguments);
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }

        $scope.canLoad = function(){
            return _canLoadMore;
        };
    })
    .controller('VenueReviewsCtrl', function($scope, $stateParams, VenuesService){
        console.log($stateParams);

        var _canLoadMore = false;
        var _pageSize = 20;
        var _page = 0;

        $scope.venueId = $stateParams.venueId;
        $scope.skip = 0;
        $scope.items = [];

        $scope.loadItems = function(id, skip){
            VenuesService
                .getReviewsForVenue(id, skip)
                .then(function(items){
                    console.log('reviews', items);
                    if(items.length < $scope.pageSize){
                        _canLoadMore = false;
                    }else{
                        _canLoadMore = true;
                        _page++;
                        $scope.skip = (_pageSize*_page)+1;
                    }

                    $scope.items = $scope.items.concat(items);
                }, function(){
                    console.log('reviews error', arguments);
                })
                .finally(function(){
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }

        $scope.canLoad = function(){
            return _canLoadMore;
        }
    });