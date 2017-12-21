const fs = require('fs');
const path = require('path');

const preDefinedHooks = require('../libs');
const findAndroidPackages = require('./findAndroidPackages');
const findIOSPodspec = require('./findIOSPodspec');

const defaultAndroidHook = (app, dependency) => {
  // Register the package
  dependency.getAndroidPackages().forEach((rp) => {
    app.mainApplication.addImport(rp.getFullName());
    app.mainApplication.addPackage(rp.getSimpleName());
  });
};

function attachHook(library, hook) {
  if (hook.ios) {
    // eslint-disable-next-line no-param-reassign
    library.iosHook = hook.ios;
  }

  if (hook.android) {
    // eslint-disable-next-line no-param-reassign
    library.androidHook = hook.android;
  }

  return library;
}

module.exports = function getLibHook(pkg) {
  const library = {
    iosHook: null,
    androidHook: null,
    androidPackages: findAndroidPackages(pkg.name),
    iosPods: findIOSPodspec(pkg.name),
  };

  // If there is a hook defined within the library itself use that
  if (pkg.foundation && pkg.foundation.hook) {
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

  // If we have defined hooks for this particular library then use that
  if (!pkg.foundation) {
    // See if we have defined a hook for this particular dependency
    if (preDefinedHooks[pkg.name]) {
      return attachHook(library, preDefinedHooks[pkg.name]);
    }
  }

  // Attach the default hooks (required only in case of android)
  // There is nothing to be done by default in case of ios
  if (library.androidPackages.length > 0) {
    library.androidHook = defaultAndroidHook;
  }

  // If there isn't anything to hook for, return null;
  if (library.iosHook || library.androidHook || library.iosPods.length > 0) {
    return library;
  }

  return null;
};
