module.exports = {
  android: ({
    code,
    subModules,
    settingsGradle,
    appGradle,
    projectGradle,
  }) => {
    settingsGradle.include('react-native-firebase');
    appGradle.projectDependency('react-native-firebase');
    code.mainApplication.import('io.invertase.firebase.RNFirebasePackage');
    code.mainApplication.addReactPackage('RNFirebasePackage()');

    projectGradle.classpath('com.google.gms:google-services', '3.1.2');
    appGradle.plugin('com.google.gms.google-services');

    const version = '11.6.0';
    appGradle.dependency('com.google.android.gms:play-services-base', version);
    appGradle.dependency('com.google.firebase:firebase-core', version);

    projectGradle.mavenRepo('https://maven.google.com');

    const sub = subModules['react-native-firebase'];
    if (sub) {
      if (sub.includes('Analytics')) {
        appGradle.dependency('com.google.firebase:firebase-analytics', version);
        code.mainApplication.import('io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage');
        code.mainApplication.addReactPackage('RNFirebaseAnalyticsPackage()');
      }

      if (sub.includes('Admob')) {
        appGradle.dependency('com.google.firebase:firebase-ads', version);
        code.mainApplication.import('io.invertase.firebase.admob.RNFirebaseAdMobPackage');
        code.mainApplication.addReactPackage('RNFirebaseAdMobPackage()');
      }
    }
  },

  ios: ({
    code,
    subModules,
    podfile,
  }) => {
    podfile.pod('RNFirebase', null, {
      path: '../node_modules/react-native-firebase/ios',
    });
    code.appDelegate.import('<Firebase.h>');
    code.appDelegate.didFinishLaunchingWithOptions('FIRApp configure', () => '');

    podfile.pod('Firebase/Core');

    const sub = subModules['react-native-firebase'];
    if (sub) {
      if (sub.includes('Analytics') >= 0) {
        // Nothing additional needed for analytics
      }

      if (sub.includes('Admob') >= 0) {
        podfile.pod('Firebase/AdMob');
      }
    }
  },
};
