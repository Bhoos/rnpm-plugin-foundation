module.exports = {
  android: (config) => {
    config.mainApplication.import('com.facebook.CallbackManager');
    config.mainApplication.import('com.facebook.FacebookSdk');

    config.mainApplication.addProperty(
      'protected static',
      'CallbackManager',
      'callbackManager',
      'CallbackManager.Factory.create()'
    );

    config.mainApplication.addReactPackage('FBSDKPackage(mCallbackManager)');
    config.mainApplication.onCreate('FacebookSdk', () => (
      'sdkInitialize(getApplicationContext())'
    ));

    config.mainActivity.onActivityResult('MainApplication.callbackManager()');
  },

  ios: (config) => {
    config.appDelegate.import('<FBSDKCoreKit/FBSDKCoreKit.h>');
    config.appDelegate.didFinishLaunchingWithOptions('[FBSDKApplicationDelegate sharedInstance');
    config.appDelegate.openURL('[FBSDKApplicationDelegate sharedInstance]', (app, url, options) => `
      application:${app}
      openURL:${url}
      sourceApplication:${options}[UIApplicationOpenURLOptionsSourceApplicationKey]
      annotation:${options}[UIApplicationOpenURLOptionsAnnotationKey]
    `);
  },
};
