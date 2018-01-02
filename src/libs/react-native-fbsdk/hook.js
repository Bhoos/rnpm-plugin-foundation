module.exports = {
  android: ({
    code,
    constants,
    manifest,
    appGradle,
    settingsGradle,
  }) => {
    settingsGradle.include('react-native-fbsdk');
    appGradle.projectDependency('react-native-fbsdk');

    manifest.metaData('com.facebook.sdk.ApplicationId', `fb${constants.fb.app.id}`);
    const appNode = manifest.node('application');
    appNode.nodeByName('activity', 'com.facebook.FacebookActivity').update({
      'android:configChanges': 'keyboard|keyboardHidden|screenLayout|screenSize|orientation',
      'android:label': constants.fb.app.name,
    });

    const intentFilter = appNode.nodeByName('activity', 'com.facebook.CustomTabActivity').update({
      'android:exported': 'true',
    }).node('intent-filter');

    intentFilter.nodeByName('action', 'android.intent.action.VIEW');
    intentFilter.nodeByName('category', 'android.intent.category.DEFAULT');
    intentFilter.nodeByName('category', 'android.intent.category.BROWSABLE');
    intentFilter.node('data').update({
      'android:scheme': `fb${constants.fb.app.id}`,
    });

    code.mainApplication.import('com.facebook.CallbackManager');
    code.mainApplication.import('com.facebook.FacebookSdk');
    code.mainApplication.import('com.facebook.reactnative.androidsdk.FBSDKPackage');
    code.mainApplication.import('android.content.Intent');

    code.mainApplication.addProperty(
      'protected static',
      'CallbackManager',
      'callbackManager',
      'CallbackManager.Factory.create()'
    );

    code.mainApplication.addReactPackage('FBSDKPackage(callbackManager)');
    // // Looks like sdkInitialize has been deprecated, no call needed
    // code.mainApplication.onCreate('FacebookSdk', () => (
    //   'sdkInitialize(getApplicationContext())'
    // ));

    code.mainActivity.import('android.content.Intent');
    code.mainActivity.onActivityResult('MainApplication.callbackManager');
  },

  ios: ({
    code,
    constants,
    plist,
    podfile,
  }) => {
    podfile.pod('react-native-fbsdk', null, {
      path: '../node_modules/react-native-fbsdk/ios',
    });

    plist.link('fbsdk', `fb${constants.fb.app.id}`);
    plist.queriesSchemes(['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension']);
    plist.set({
      FacebookAppID: constants.fb.app.id,
      FacebookDisplayName: constants.fb.app.name,
    });

    code.appDelegate.import('<FBSDKCoreKit/FBSDKCoreKit.h>');
    code.appDelegate.didFinishLaunchingWithOptions('[FBSDKApplicationDelegate sharedInstance]');
    code.appDelegate.openURL('[FBSDKApplicationDelegate sharedInstance]', (app, url, options) => `
      application:${app}
      openURL:${url}
      sourceApplication:${options}[UIApplicationOpenURLOptionsSourceApplicationKey]
      annotation:${options}[UIApplicationOpenURLOptionsAnnotationKey]
    `);
  },
};
