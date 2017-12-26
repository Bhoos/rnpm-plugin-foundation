module.exports = {
  android: ({ code }) => {
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

    code.mainActivity.onActivityResult('MainApplication.callbackManager');
  },

  ios: ({ code }) => {
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
