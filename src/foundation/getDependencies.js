const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const flatten = require('./util/flatten');
const isObject = require('./util/isObject');
const createFromTemplate = require('./util/createFromTemplate');

const getLibInfo = require('./getLibInfo');

function getSubModules(pkg, lib) {
  // special case for 'react-native' where we need to append to
  // basic subspecs
  const res = lib !== 'React' ? [] : [
    'Core', 'RCTActionSheet', 'RCTBlob', 'RCTAnimation',
    'RCTGeolocation', 'RCTImage', 'RCTNetwork', 'RCTSettings',
    'RCTText', 'RCTVibration', 'RCTWebSocket',
  ];

  if (isObject(pkg.foundation)
      && isObject(pkg.foundation['sub-modules'])) {
    const r = pkg.foundation['sub-modules'][lib];
    if (Array.isArray(r)) {
      return res.concat(r);
    }

    if (isObject(r)) {
      return res.concat(Object.keys(r));
    }
  }

  return res;
}

/**
 * Retrieve all the dependencies that needs to be processed by the plugin
 * Create podspec file if not provided by the library
 * @param {*} pkg The main package
 */
module.exports = function getDependencies(pkg) {
  const libraries = [];
  const localPodspecs = path.resolve('ios', 'Pods', 'Local Podspecs');

  // Get all the hooks for this package
  Object.keys(pkg.dependencies || {}).forEach((d) => {
    const dPkg = JSON.parse(fs.readFileSync(`./node_modules/${d}/package.json`));
    const lib = getLibInfo(dPkg);

    // No need to do anything
    if (lib === null) {
      return;
    }

    // Create a podspec file within the pods folder and use it
    const podspecs = lib.iosPods.map((pod, index) => {
      if (pod.files) {
        // Make sure we have a "Local Podspecs" folder
        mkdirp.sync(localPodspecs);

        const podspecFile = path.resolve(localPodspecs, `${dPkg.name}.podspec`);
        // Create a pod spec file with the given source files
        const dict = {
          pkg: {
            name: dPkg.name,
            version: dPkg.version,
            description: dPkg.description,
            license: dPkg.license,
            author: dPkg.author,
            homepage: dPkg.homepage,
            source: `{ :${dPkg.repository.type} => "${dPkg.repository.url}"}`,
          },
          FILES: pod.files.map(f => `"${f}"`).join(','),
        };
        createFromTemplate('Podspec', flatten(dict, '.'), podspecFile);

        return {
          name: dPkg.name,
          path: podspecFile,
          // Since there aren't any subspecs defined, there is no point for this
          // subspecs: getSubModules(pkg, dPkg.name),
        };
      }

      const res = {
        name: pod.name,
        path: pod.path,
        subspecs: getSubModules(pkg, pod.name),
      };

      // In case there weren't any submodules defined for the pod name
      // see if we could find it useing the package name
      if (index === 0 && res.subspecs.length === 0 && res.name !== dPkg.name) {
        res.subspecs = getSubModules(pkg, dPkg.name);
      }
      return res;
    });

    libraries.push({
      runHook: (platform, app) => {
        if (lib.hook[platform]) {
          lib.hook[platform](app, lib);
        }
      },
      package: dPkg,
      podspecs,
      androidPackages: lib.androidPackages,
      plist: lib.plist,
    });
  });

  return libraries;
};
