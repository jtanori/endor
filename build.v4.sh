rm jound.apk
cordova plugin rm cordova-plugin-console
cordova build android
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore jound-prod.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk jound-prod
$ANDROID_SDK_HOME/build-tools/23.0.1/zipalign -v 4 $HOME/Documents/endor/platforms/android/build/outputs/apk/android-release-unsigned.apk jound.apk
