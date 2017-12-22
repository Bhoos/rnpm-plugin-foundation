const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const flatten = require('./util/flatten');
const isObject = require('./util/isObject');
const createFromTemplate = require('./util/createFromTemplate');

const getLibInfo = require('./getLibInfo');

function getSubModules(pkg, lib) {
  if (isObject(pkg.foundation)
      && isObject(pkg.foundation['sub-modules'])) {
    const r = pkg.foundation['sub-modules'][lib];
    if (Array.isArray(r)) {
      return r;
    }

    if (isObject(r)) {
      return Object.keys(r);
    }
  }

  return [];
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
    const podspecs = lib.iosPods.map((pod) => {
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
          },
          FILES: pod.files.map(f => `"${f}"`).join(','),
        };
        createFromTemplate('Podspec', flatten(dict, '.'), podspecFile);

        return {
          name: dPkg.name,
          path: podspecFile,
        };
      }

      return pod;
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
      subspecs: getSubModules(pkg, dPkg.name),
    });
  });

  return libraries;
};
