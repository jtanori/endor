angular
    .module('jound.services')
    .service('LinksService', function() {
        function openExternalApp(type, identifier, subIdentifier) {
            var url, uriScheme, schemeUrl;

            var isIOS = ionic.Platform.isIOS();

            switch (type) {
                case 'twitter':
                    uriScheme = isIOS ? type + '://' : 'com.twitter.android';
                    schemeUrl = 'twitter://user?screen_name=' + identifier;
                    url = 'https://twitter.com/' + identifier;
                    break;
                case 'twitter:media':
                    uriScheme = isIOS ? type + '://' : 'com.twitter.android';
                    schemeUrl = 'twitter://status?user_id=' + identifier + '&status_id=' + subIdentifier;
                    url = 'https://twitter.com/' + identifier + '/status/' + subIdentifier;
                    break;
                case 'twitter:hashtag':
                    uriScheme = isIOS ? type + '://' : 'com.twitter.android';
                    schemeUrl = 'twitter://search?query=' + identifier;
                    url = 'https://twitter.com/search?q=' + encodeURIComponent(identifier);
                    break;
                case 'fb':
                    uriScheme = isIOS ? type + '://' : 'com.facebook.katana';
                    schemeUrl = 'fb://profile/' + identifier;
                    url = 'https://facebook.com/' + identifier;
                    break;
                case 'instagram':
                    uriScheme = isIOS ? type + '://' : 'com.instagram.android';
                    schemeUrl = 'instagram://user?username=' + identifier;
                    url = 'https://instagram.com/' + identifier;
                    break;
                case 'instagram:media':
                    uriScheme = isIOS ? type + '://' : 'com.instagram.android';
                    schemeUrl = 'instagram://media?id=' + identifier;
                    url = 'https://instagram.com/p/' + identifier;
                    break;
                case 'instagram:hashtag':
                    uriScheme = isIOS ? type + '://' : 'com.instagram.android';
                    schemeUrl = 'instagram://tag?name=' + identifier;
                    url = 'https://instagram.com/explore/tags/' + identifier;
                    break;
                case 'youtube':
                    uriScheme = isIOS ? type + '://' : 'com.google.android.youtube';
                    schemeUrl = 'vnd.youtube://user/' + identifier;
                    url = 'https://www.youtube.com/' + identifier;
                    break;
                case 'youtube:channel':
                    uriScheme = isIOS ? type + '://' : 'com.google.android.youtube';
                    schemeUrl = 'youtube://channel/' + identifier;
                    url = 'https://www.youtube.com/channel/' + identifier;
                    break;
                case 'youtube:video':
                    uriScheme = isIOS ? type + '://' : 'com.google.android.youtube';
                    schemeUrl = 'vnd.youtube://' + identifier;
                    url = 'https://www.youtube.com/watch?v=' + identifier;
                    break;
                case 'pinterest':
                    uriScheme = isIOS ? type + '://' : 'com.pinterest';
                    schemeUrl = 'pinterest://user/' + identifier;
                    url = 'https://www.pinterest.com/' + identifier;
                    break;
            }

            appAvailability.check(
                uriScheme,
                function() {
                    window.open(schemeUrl, '_system', 'location=no');
                },
                function(error) { // Error callback
                    window.open(url, '_system', 'location=no');
                }
            );
        };

        function openURL(address){
            if(typeof address !== "string"){
                throw new Error('No valid address provided');
            }
            
            if(address.indexOf('http://') === -1 && address.indexOf('https://') === -1){
                address = 'http://' + address;
            }
            
            window.open(address, '_system', 'location=yes');
        }

        return {
            openExternalApp: openExternalApp,
            open: openURL
        };
    });