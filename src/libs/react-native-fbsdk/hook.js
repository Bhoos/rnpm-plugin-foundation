module.exports = {
  android: ({ code, manifest }) => {
    manifest.metaData('com.facebook.sdk.ApplicationId', 'fb{{fb.app.id}}');
    const appNode = manifest.node('application');
    appNode.create('activity', {
      'android:name': 'com.facebook.FacebookActivity',
      'android:configChanges': 'keyboard|keyboardHidden|screenLayout|screenSize|orientation',
      'android:label': '{{fb.app.name}}',
    });

    const intentFilter = appNode.create('activity', {
      'android:name': 'com.facebook.CustomTabActivity',
      'android:exported': 'true',
    }).create('intent-filter');
    intentFilter.create('action', { 'android:name': 'android.intent.action.VIEW' });
    intentFilter.create('category', { 'android:name': 'android.intent.category.DEFAULT' });
    intentFilter.create('category', { 'android:name': 'android.intent.category.BROWSABLE' });
    intentFilter.create('data', { 'android:scheme': 'fb{{fb.app.id}}' });

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

  ios: ({ code, plist }) => {
    plist.link('fb{{fb.app.id}}');
    plist.queriesSchemes(['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension']);
    plist.set({
      FacebookAppID: '{{fb.app.id}}',
      FacebookDisplayName: '{{fb.app.name}}',
    });

    code.appDelegate.import('<FBSDKCoreKit/FBSDKCoreKit.h>');
    code.appDelegate.didFinishLaunchingWithOptions('[FBSDKApplicationDelegate sharedInstance');
    code.appDelegate.openURL('[FBSDKApplicationDelegate sharedInstance]', (app, url, options) => `
      application:${app}
      openURL:${url}
      sourceApplication:${options}[UIApplicationOpenURLOptionsSourceApplicationKey]
      annotation:${options}[UIApplicationOpenURLOptionsAnnotationKey]
    `);
  },
};
