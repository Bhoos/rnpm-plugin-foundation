const path = require('path');
const fs = require('fs');

const PLUGIN = require('../../package.json');

/**
 * Lock File Information
 * app: name, version
 * foundationPluginVersion: Lower version of plugin must not be allowed to operate
 * rnSubModules: The list of additional submodules activated on the app
 * dependencies: [
 *  name,
 *  version,
 *  subModules,
 * ]
 */
class LockFile {
  constructor(file) {
    this.file = file;

    this.app = '';
    this.appVersion = '';
    this.pluginVersion = '';
    this.rnVersion = '';
    this.rnSubModules = [];
    this.dependencies = {};
  }

  updateDependency(name, version, podspecs, subspecs, androidPackages) {
    this.dependencies[name] = {
      name, version, podspecs, subspecs, androidPackages,
    };
  }

  save() {
    const data = {
      app: this.app,
      appVersion: this.appVersion,
      pluginVersion: this.pluginVersion,
      constants: this.constants,
      dependencies: Object.keys(this.dependencies).map(k => this.dependencies[k]),
    };

    fs.writeFileSync(this.file, JSON.stringify(data, '', 2));
  }
}

function getData(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (e) {
    return {
      app: '',
      appVersion: '',
      constants: {},
      pluginVersion: PLUGIN.version,
      dependencies: [],
    };
  }
}

LockFile.load = (file) => {
  const data = getData(file);

  const l = new LockFile(file);
  l.app = data.app;
  l.appVersion = data.appVersion;
  l.pluginVersion = data.pluginVersion;
  l.constants = data.constants;
  l.rnVersion = data.rnVersion;
  l.rnSubModules = data.rnSubModules;
  l.dependencies = data.dependencies.reduce((res, v) => Object.assign(res, {
    [v.name]: v,
  }, {}));

  return l;
};

LockFile.create = (pkg, libs, constants) => {
  const lockFile = path.resolve('./foundation.lock');
  const l = new LockFile(lockFile);

  l.app = pkg.name;
  l.appVersion = pkg.version;
  l.pluginVersion = PLUGIN.version;
  l.constants = constants;

  libs.forEach((lib) => {
    l.updateDependency(
      lib.package.name,
      lib.package.version,
      lib.podspecs,
      lib.subspecs,
      lib.androidPackages
    );
  });

  l.save();
  return l;
};

module.exports = LockFile;
