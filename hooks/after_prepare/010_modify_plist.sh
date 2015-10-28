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
Add :NSExceptionDomains:NSExceptionDomains dict
Add :NSExceptionDomains:NSExceptionDomains:facebook.com dict
Add :NSExceptionDomains:NSExceptionDomains:facebook.com:NSIncludesSubdomains bool true
Add :NSExceptionDomains:NSExceptionDomains:facebook.com:NSThirdPartyExceptionRequiresForwardSecrecy bool false
Add :NSExceptionDomains:NSExceptionDomains:fbcdn.net dict
Add :NSExceptionDomains:NSExceptionDomains:fbcdn.net:NSIncludesSubdomains bool true
Add :NSExceptionDomains:NSExceptionDomains:fbcdn.net:NSThirdPartyExceptionRequiresForwardSecrecy bool false
Add :NSExceptionDomains:NSExceptionDomains:akamaihd.net dict
Add :NSExceptionDomains:NSExceptionDomains:akamaihd.net:NSIncludesSubdomains bool true
Add :NSExceptionDomains:NSExceptionDomains:akamaihd.net:NSThirdPartyExceptionRequiresForwardSecrecy bool false
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done

true