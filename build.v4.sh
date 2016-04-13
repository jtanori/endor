rm jound-armv7.apk
rm jound-x86.apk

cordova plugin rm cordova-plugin-console
cordova build android
cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore jound-prod.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk jound-prod
$ANDROID_HOME/build-tools/23.0.2/zipalign -v 4 $HOME/Documents/endor/platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk jound-armv7.apk

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore jound-prod.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk jound-prod
$ANDROID_HOME/build-tools/23.0.2/zipalign -v 4 $HOME/Documents/endor/platforms/android/build/outputs/apk/android-x86-release-unsigned.apk jound-x86.apk
