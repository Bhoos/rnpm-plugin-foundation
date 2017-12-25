const fs = require('fs');
const path = require('path');

const preDefinedHooks = require('../libs');
const findAndroidPackages = require('./findAndroidPackages');
const findIOSPodspec = require('./findIOSPodspec');

const defaultAndroidHook = (app, dependency) => {
  // Register the package
  dependency.androidPackages.forEach((rp) => {
    app.code.mainApplication.addImport(rp.fullName);
    app.code.mainApplication.addPackage(rp.packageName);
  });
};

function attachHook(library, hook) {
  if (!library.hook) {
    // eslint-disable-next-line no-param-reassign
    library.hook = {};
  }

  if (hook.ios) {
    // eslint-disable-next-line no-param-reassign
    library.hook.ios = hook.ios;
  }

  if (hook.android) {
    // eslint-disable-next-line no-param-reassign
    library.hook.android = hook.android;
  }

  return library;
}

module.exports = function getLibHook(pkg) {
  const library = {
    hook: {},
    androidPackages: findAndroidPackages(pkg.name),
    iosPods: findIOSPodspec(pkg.name),
  };

  // If there is a hook defined within the library itself use that
  if (pkg.foundation) {
    // check for plist
    if (pkg.foundation.plist) {
      const plistPath = path.resolve('.', 'node_modules', pkg.name, pkg.foundation.plist);
      if (fs.exists(plistPath)) {
        library.plist = plistPath;
      }
    }

    // Check for hook
    if (pkg.foundation.hook) {
      const hookPath = path.resolve('.', 'node_modules', pkg.name, pkg.foundation.hook);

      if (fs.existsSync(hookPath)) {
        try {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const hook = require(hookPath);
          return attachHook(library, hook);
        } catch (err) {
          throw new Error(`Error while retrieving hook for dependency ${pkg.name} from ${pkg.foundation.hook}`);
        }
      }
    }
  }

  // If we have defined hooks for this particular library then use that
  if (!pkg.foundation) {
    // Check if there is plist file in our lib section
    const plistPath = path.resolve(__dirname, '..', 'libs', pkg.name, 'RNFoundation-Info.plist');
    if (fs.existsSync(plistPath)) {
      library.plist = plistPath;
    }

    // See if we have defined a hook for this particular dependency
    if (preDefinedHooks[pkg.name]) {
      return attachHook(library, preDefinedHooks[pkg.name]);
    }
  }

  // Attach the default hooks (required only in case of android)
  // There is nothing to be done by default in case of ios
  if (library.androidPackages.length > 0) {
    attachHook(library, { android: defaultAndroidHook });
  }

  // If there isn't anything to hook for, return null;
  if (library.hook.ios || library.hook.android || library.iosPods.length > 0) {
    return library;
  }

  return null;
};
