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
        getLogo: function(){
            if(_.isString(this.get('logo'))){
                return this.get('logo');
            }else if(this.get('logo') && this.get('logo').get('file')){
                return this.get('logo').get('file').url();
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
                email: !!this.get('email_address'),
                www: this.getWWW()
            };
        }
    });
})
.factory('CategoryModel', function(){
    return Parse.Object.extend({className: 'Category'});
})
.factory('VenuesService', function($q, $http, VenueModel, SanitizeService, CategoryModel, AppConfig) {

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
                    query.containedIn('keywords', SanitizeService.strings.sanitize(q));
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

            console.log(id, _currentResults);

            if(_currentResults.length){
                found = _currentResults.find(function(v){
                    return v.id === id;
                });
            }

            if(found){
                deferred.resolve(found);
            }else{
                $http
                    .get(AppConfig.API_URL + 'venue/' + id)
                    .then(function(response){
                        deferred.resolve(response);
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
            }

            if(!_currentVenue){
                deferred.reject({message: 'No venue to get channel from'});
            }

            $http
                .post(AppConfig.API_URL + 'getChannelForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    deferred.reject(response);
                });

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
        getReviewsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
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
        current: function(venue){
            if(venue){
                _currentVenue = venue;
            }else{
                return venue;
            }
        }
    };
});