rm jound.apk
cordova plugin rm cordova-plugin-console
cordova build android
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore jound-prod.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk jound-prod
/Users/addy/Documents/projects/android-sdk-macosx/build-tools/23.0.1/zipalign -v 4 /Users/addy/Documents/projects/jound-ionic/platforms/android/build/outputs/apk/android-release-unsigned.apk jound.apk