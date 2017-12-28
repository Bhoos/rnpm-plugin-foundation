// Use the hook to add overrides for submodule specific code changes

module.exports = {
  android: ({ code, subModules, manifest }) => {
    // if (subModules.React && subModules.React.RCTLinking) {
    //   const scheme = 'https';
    //   const { host, pathPrefix } = subModules.React.RCTLinking;

    //   code.androidManifest
    //     .intentFilter(`${host}${pathPrefix}`, (n) => {
    //       n.add('action', { 'android:name': 'android.intent.action.VIEW' });
    //       n.add('category', { 'android:name': 'android.intent.category.DEFAULT' });
    //       n.add('category', { 'android:name': 'android.intent.category.BROWSABLE' });
    //       n.add('data', {
    //         'android:scheme': scheme,
    //         'android:host': host,
    //         'android:pathPrefix': pathPrefix,
    //       });
    //     });
    // }
  },

  ios: ({ subModules }) => {
    // console.log(subModules);
    // // Fix code for Linking submodule
    // if (subModules.React && subModules.React.RCTLinking) {
    //   const scheme = 'https';
    //   const { host, pathPrefix } = subModules.React.RCTLinking;



    // }
  },
};
