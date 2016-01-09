#!/bin/bash

PLIST=platforms/ios/*/*-Info.plist

cat << EOF |
Add :LSApplicationQueriesSchemes array
Add :LSApplicationQueriesSchemes:0 string twitter
Add :LSApplicationQueriesSchemes:1 string instagram
Add :LSApplicationQueriesSchemes:2 string facebook
Add :LSApplicationQueriesSchemes:3 string fb
Add :LSApplicationQueriesSchemes:4 string safari
Add :LSApplicationQueriesSchemes:5 string fbapi
Add :LSApplicationQueriesSchemes:6 string fbapi20130214
Add :LSApplicationQueriesSchemes:7 string fbapi20130410
Add :LSApplicationQueriesSchemes:8 string fbapi20130702
Add :LSApplicationQueriesSchemes:9 string fbapi20131010
Add :LSApplicationQueriesSchemes:10 string fbapi20131219
Add :LSApplicationQueriesSchemes:11 string fbapi20140410
Add :LSApplicationQueriesSchemes:12 string fbapi20140116
Add :LSApplicationQueriesSchemes:13 string fbapi20150313
Add :LSApplicationQueriesSchemes:14 string fbapi20150629
Add :LSApplicationQueriesSchemes:15 string fbauth
Add :LSApplicationQueriesSchemes:16 string fbauth2
Add :LSApplicationQueriesSchemes:17 string fb-messenger-api20140430
Add :NSAppTransportSecurity dict
Add :NSAppTransportSecurity:NSExceptionDomains dict
Add :NSAppTransportSecurity:NSExceptionDomains:facebook.com dict
Add :NSAppTransportSecurity:NSExceptionDomains:facebook.com:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:facebook.com:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:fbcdn.net dict
Add :NSAppTransportSecurity:NSExceptionDomains:fbcdn.net:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:fbcdn.net:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:akamaihd.net dict
Add :NSAppTransportSecurity:NSExceptionDomains:akamaihd.net:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:akamaihd.net:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:parse.com dict
Add :NSAppTransportSecurity:NSExceptionDomains:parse.com:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:parse.com:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:jound.mx dict
Add :NSAppTransportSecurity:NSExceptionDomains:jound.mx:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:jound.mx:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:api.jound.mx dict
Add :NSAppTransportSecurity:NSExceptionDomains:api.jound.mx:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:api.jound.mx:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:gravatar.com dict
Add :NSAppTransportSecurity:NSExceptionDomains:gravatar.com:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:gravatar.com:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:parsetfss.com dict
Add :NSAppTransportSecurity:NSExceptionDomains:parsetfss.com:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:parsetfss.com:NSExceptionAllowsInsecureHTTPLoads bool YES
Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool YES
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done

true