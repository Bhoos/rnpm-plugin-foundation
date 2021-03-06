const fs = require('fs');
const path = require('path');

const preDefinedHooks = require('../libs');
const findAndroidPackages = require('./findAndroidPackages');
const findIOSPodspec = require('./findIOSPodspec');

const defaultAndroidHook = ({ code, appGradle, settingsGradle }, dependency) => {
  settingsGradle.include(dependency.pkg.name);
  appGradle.projectDependency(dependency.pkg.name);

  // Register the package
  dependency.androidPackages.forEach((rp) => {
    code.mainApplication.import(rp.fullName);
    code.mainApplication.addReactPackage(`${rp.name}()`);
  });
};

const defaultIOSHook = ({ sourceDir, podfile }, dependency) => {
  dependency.podspecs.forEach((p) => {
    podfile.pod(p.name, null, {
      path: path.relative(sourceDir, path.dirname(p.path)),
    });
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
    pkg,
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

    // The library may want to include the android manifest file separately
    // for the foundation plugin
    // if there is a manifest file, copy it within the node_modules
    if (pkg.foundation.manifest) {
      const manifestPath = path.resolve('.', 'node_modules', pkg.name, pkg.foundation.manifest);
      if (fs.existsSync(manifestPath)) {
        const dest = path.resolve('node_modules', pkg.name, 'android', 'src', 'main', 'AndroidManifest.xml');
        fs.copyFileSync(manifestPath, dest);
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

    // if there is a manifest file, copy it within the node_modules
    const manifestPath = path.resolve(__dirname, '..', 'libs', pkg.name, 'AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      const dest = path.resolve('node_modules', pkg.name, 'android', 'src', 'main', 'AndroidManifest.xml');
      fs.copyFileSync(manifestPath, dest);
    }

    // See if we have defined a hook for this particular dependency
    if (preDefinedHooks[pkg.name]) {
      return attachHook(library, preDefinedHooks[pkg.name]);
    }
  }

  // Attach the default hooks (required only in case of android)
  // There is nothing to be done by default in case of ios
  if (library.androidPackages.length > 0) {
    attachHook(library, {
      android: defaultAndroidHook,
      ios: defaultIOSHook,
    });
  }

  // If there isn't anything to hook for, return null;
  if (library.hook.ios || library.hook.android || library.iosPods.length > 0) {
    return library;
  }

  return null;
};
