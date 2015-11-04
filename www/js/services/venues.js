angular.module('jound.services')

.factory('VenueModel', function(){
    return Parse.Object.extend('Location', {
        pageLoaded: false,
        getURL: function(){
            return '//www.jound.mx/venue/' + this.id;
        },
        getWWW: function(){
            if(this.get('www')){
                return this.get('www').replace(/^(https?|ftp):\/\//, '');
            }
        },
        getAddress: function(){
            var address = '';
            var n = this.get('exterior_number');
            var castedN = parseInt(n, 10);

            if(!_.isEmpty(this.get('road_type'))){
                address += this.escape('road_type') + ' ' + this.escape('road_name');
            }

            if(!_.isEmpty(this.get('road_type_1'))){
                address += ' entre ' + this.escape('road_type_1') + ' ' + this.escape('road_name_1');
            }

            if(!_.isEmpty(this.get('road_type_2'))){
                address += ' y ' + this.escape('road_type_2') + ' ' + this.escape('road_name_2');
            }

            if(n){
                if(!_.isNaN(castedN) && _.isNumber(castedN)){
                    address += ' #' + _.escape(n);
                }else if(!_.isString(n)){
                    if(n === 'SN' || n === 'sn'){
                        address += ' Sin numero';
                    }else {
                        address += ' #' + _.escape(n);
                    }
                }
            }

            return address;
        },
        getVecinity: function(){
            var address = '';

            if(this.get('settling_type') && this.get('settling_name')){
                address += this.get('settling_type') + ' ' + this.get('settling_name');
            }else if(this.get('settling_name')){
                address += 'Colonia ' + this.get('settling_name');
            }

            return address;
        },
        getCityName: function(){
            var city = '';
            var l = this.get('locality');
            var m = this.get('municipality');

            if(!_.isEmpty(l)){
                city = l;
            }else{
                city = m;
            }

            return city;
        },
        getCity: function(){
            var city = '';
            var l = this.get('locality');
            var m = this.get('municipality');
            var s = this.get('federal_entity');

            if(l === m){
                city += l + ', ' + s;
            }else {
                city += l + ', ' + m + ', ' + s;
            }

            if(this.get('postal_code')){
                city += ' C.P ' + this.escape('postal_code');
            }

            return city;
        },
        getBanner: function(){
            if(_.isString(this.get('logo'))){
                return {url:this.get('logo')};
            }else if(this.get('logo')){
                if(this.get('logo').file){
                    return {url:this.get('logo').file._url};
                }else{
                    return {url:this.get('logo').get('file').url()};
                }
            }else{
                return {url:'img/splash.jpg', isDefault: true};
            }
        },
        getLogo: function(){
            if(_.isString(this.get('logo'))){
                return this.get('logo');
            }else if(this.get('logo')){
                if(this.get('logo').file){
                    return this.get('logo').file._url;
                }else{
                    return this.get('logo').get('file').url();
                }
            }else{
                return 'img/venue_default_large.jpg';
            }
        },
        getBasicData: function(){
            return {
                name: this.get('name'),
                address: this.getAddress(),
                city: this.getCity(),
                vecinity: this.getVecinity(),
                phoneNumber: this.get('phone_number'),
                url: this.get('www'),
                activity: this.get('activity_description'),
                logo: this.getLogo(),
                email: this.get('email_address'),
                www: this.getWWW()
            };
        }
    });
})
.factory('CategoryModel', function(){
    return Parse.Object.extend({className: 'Category'});
})
.factory('VenuesService', function($q, $http, $cordovaDevice, VenueModel, SanitizeService, CategoryModel, AppConfig, User) {

    var _currentResults = [];
    var _currentVenue;

    return {
        //Search by query, position and category
        search: function(p, r, q, c){
            var deferred = $q.defer();

            if(!p || !r){
                deferred.reject({message: 'VenuesService.search requires at least two arguments', code: 101});
            }

            var query = new Parse.Query(VenueModel);
            var category;
            var geoPoint = new Parse.GeoPoint({latitude: p.coords.latitude, longitude: p.coords.longitude});

            if(q){
                q = q.split(' ');
                q = _.chain(q).compact().uniq().invoke('trim').invoke('toLowerCase').value();

                if(q.length === 1){
                    query.equalTo('keywords', q[0].toLowerCase());
                }else if(q.length > 1){
                    query.containsAll('keywords', SanitizeService.strings.sanitize(q));
                }
            }

            if(c && c !== 'all'){
                category = new CategoryModel();
                category.id = c;
                query.equalTo('category', category);
            }

            //Search near current position
            query
                .near('position', geoPoint)
                .withinKilometers('position', geoPoint, r/1000)
                .include('logo')
                .include('page')
                .include('claimed_by')
                .select(AppConfig.QUERY.VENUE_DEFAULT_FIELDS)
                .limit(200)
                .find()
                .then(
                    function(results){
                        if(results.length){
                            _currentResults = results;
                            deferred.resolve(results);
                        }else{
                            deferred.reject({message: 'No encontramos resultados, intenta buscar en un rango mas amplio.'});
                        }
                    }, function(e){
                        deferred.reject(e);
                    }
                );

            return deferred.promise;
        },
        getById: function(id){
            var deferred = $q.defer();
            var found = false, query;

            if(_currentResults.length){
                found = _.find(_currentResults, function(v){
                    return v.id === id;
                });
            }

            if(found){
                deferred.resolve(found);
            }else{
                $http
                    .get(AppConfig.API_URL + 'venue/' + id)
                    .then(function(response){
                        var v = new VenueModel();
                        var P = Parse.Object.extend('Page');
                        var p;

                        if(response.data.venue && response.data.venue.page){
                            p = new P(response.data.venue.page);
                        }

                        v.set(response.data.venue);
                        v.set('page', p);

                        deferred.resolve(v);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        getChannel: function(config){
            var deferred = $q.defer();

            if(!config){
                deferred.reject({message: 'No channel config provided'});
            } else {
                $http
                    .post(AppConfig.API_URL + 'getChannelForVenue', config)
                    .then(function(response){
                        deferred.resolve(response.data);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        getProductsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            $http
                .post(AppConfig.API_URL + 'getProductsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getReviewsForVenue: function(venueId, skip, pageSize, sinceDate, maxDate){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            if(pageSize && _.isNumber(pageSize)){
                config.pageSize = pageSize;
            }

            if(sinceDate){
                config.sinceDate = sinceDate;
                config.skip = 0;
            }

            if(maxDate){
                config.maxDate = maxDate;
                config.skip = 0;
            }
            
            $http
                .post(AppConfig.API_URL + 'getReviewsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getDealsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            $http
                .post(AppConfig.API_URL + 'getDealsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getEventsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            $http
                .post(AppConfig.API_URL + 'getEventsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        saveReview: function(id, text, userId, rating){
            var deferred = $q.defer();
            var config = {id: id, text: text, rating: rating, userId: userId};

            if(_.isEmpty(id)) {
                deferred.reject('No venue ID provided');
            }else if(_.isEmpty(text)) {
                deferred.reject('No review to post provided');
            }else if(_.isEmpty(userId)) {
                deferred.reject('No user ID provided');
            }else {
                $http
                    .post(AppConfig.API_URL + 'saveReviewForVenue', config)
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        updatePage: function(id, attr, val){
            var deferred = $q.defer();

            if(_.isEmpty(attr)) {
                deferred.reject('Please provide an attribute to update');
            }else if(!_.isEmpty(id)) {
                deferred.reject('Please provide a page id');
            }else {
                $http
                    .post(AppConfig.API_URL + 'updatePage', {id: id, attr: attr, val: val})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        current: function(venue){
            if(venue){
                _currentVenue = venue;
            }else{
                return venue;
            }
        },
        claim: function(id, details){
            var deferred = $q.defer();

            if(_.isEmpty(details)) {
                deferred.reject('Please provide details object.');
            }else if(_.isEmpty(User.current())) {
                deferred.reject('Please login to claim a business');
            }else {
                $http
                    .post(AppConfig.API_URL + 'claimVenue', {id: id, userId: User.current().id, details: details})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        isClaimed: function(id){
            var deferred = $q.defer();

            if(_.isEmpty(id)) {
                deferred.reject('Please provide a venue id.');
            }else {
                $http
                    .post(AppConfig.API_URL + 'venueIsClaimed', {id: id})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        report: function(id, details, problemType){
            var device = $cordovaDevice.getDevice();
            var cordova = $cordovaDevice.getCordova();
            var model = $cordovaDevice.getModel();
            var platform = $cordovaDevice.getPlatform();
            var uuid = $cordovaDevice.getUUID();
            var version = $cordovaDevice.getVersion();
            var userId = User.current().id;
            var parseVersion = Parse.VERSION;
            var deferred = $q.defer();

            if(_.isEmpty(id)) {
                deferred.reject('Please provide a venue id.');
            }else {
                $http
                    .post(AppConfig.API_URL + 'report', {
                        id: id,
                        userId: User.current().id,
                        device: device,
                        cordova: cordova,
                        model: model,
                        platform: platform,
                        uuid: uuid,
                        version: version,
                        parseVersion: parseVersion,
                        details: details,
                        problemType: problemType
                    })
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        }
    };
});