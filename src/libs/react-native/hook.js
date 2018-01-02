const log = require('npmlog');

// Use the hook to add overrides for submodule specific code changes
module.exports = {
  android: ({
    config,
    subModules,
    manifest,
    projectGradle,
  }) => {
    projectGradle.mavenRepo('https://maven.google.com');

    const sub = subModules['react-native'];
    if (sub && sub.Linking) {
      const links = Array.isArray(sub.Linking) ? sub.Linking : [sub.Linking];
      links.forEach((link) => {
        const { scheme = 'https', host = '', pathPrefix = '/' } = link;
        const appLink = scheme === 'https' || scheme === 'http';

        manifest.link(scheme, host, pathPrefix, true);
        if (appLink) {
          // Display message to include assetlinks.json
          log.info('', ` You will need to add a 'assetlinks.json' file which should be accessible via https://${host}/.well-known/assetlinks.json`);
          log.info('', ' The content of the json file should look like (typically)');
          log.info('code', '   [{');
          log.info('code', '     "relation": "delegate_permission/common.handle_all_urls"');
          log.info('code', '     "target": {');
          log.info('code', '       "namespace": "android_app",');
          log.info('code', `       "package_name": "${config.bundleId}",`);
          log.info('code', '       "sha256_cert_fingerprints":');
          log.info('code', '       ["...."]');
          log.info('code', '     }');
          log.info('code', '   }]');
          log.info('', " Run '$ keytool -list -v -keystore my-release-key.keystore' to generate the fingerprint");
          log.info('', ' Visit https://developer.android.com/training/app-links/verify-site-associations.html for more information');
        }
      });
    }
  },

  ios: ({
    config,
    code,
    subModules,
    plist,
    entitlements,
    podfile,
  }) => {
    const podspecPath = '../node_modules/react-native';
    const sub = subModules['react-native'];
    if (sub) {
      if (sub.Linking) {
        if (!entitlements) {
          log.error('error', 'It looks like you haven\'t enabled entitlements on your ios project');
          log.error('error', 'To use universal links you will have to enable Associated Domains feature from Xcode');
          log.error('error', 'The Associated Domains is available on YourApp > Capabilities');
          throw new Error('Entitlements not activated yet');
        }

        const links = Array.isArray(sub.Linking) ? sub.Linking : [sub.Linking];

        links.forEach((link) => {
          const { scheme = 'https', host, pathPrefix = '/' } = link;

          const universalLink = scheme === 'https' || scheme === 'http';
          if (universalLink) {
            code.appDelegate.import('<React/RCTLinkingManager.h>');
            code.appDelegate.continueUserActivity('RCTLinkingManager');

            // Add the domains to the entitlements
            entitlements.domain(host);

            // Display the site-association json information
            log.info('', `Your will need to add a 'apple-app-site-association.json' file which should be accessible via https://${host}/.well-known/apple-app-site-association`);
            log.info('', 'The content of the file should be a json of the following format');
            log.info('code', '  {');
            log.info('code', '    "applinks": {');
            log.info('code', '      "apps": [],');
            log.info('code', '      "details": [');
            log.info('code', '        {');
            log.info('code', `          "appId": "${entitlements.developmentTeam}.${config.bundleId}",`);
            log.info('code', `          "paths": ["${pathPrefix}*"]`);
            log.info('code', '        }');
            log.info('code', '      ]');
            log.info('code', '    }');
            log.info('code', '  }');
            log.info('', 'Visit https://developer.apple.com/library/content/documentation/General/Conceptual/AppSearch/UniversalLinks.html for form information');
          } else if (scheme) {
            // Deep link support for the given scheme
            plist.link(scheme);
          }
        });

        podfile.pod('React/RCTLinkingIOS', null, {
          path: podspecPath,
        });
      }

      if (sub.ART) {
        podfile.pod('React/ART', null, {
          path: podspecPath,
        });
      }
    }
    // if (subModules.React && subModules.React.RCTLinking) {

    // }
  },
};
