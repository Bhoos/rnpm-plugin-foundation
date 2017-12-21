const fs = require('fs');
const path = require('path');
const log = require('npmlog');
const xcode = require('xcode');
const semver = require('semver');

const flatten = require('./util/flatten');

const platforms = require('./platforms');

const getDependencies = require('./getDependencies');
const generateAppDelegate = require('./code/AppDelegate.m');
const generateMainActivity = require('./code/MainActivity.java');
const generateMainApplication = require('./code/MainApplication.java');
const LockFile = require('./LockFile');

const PLUGIN = require('../../package.json');

module.exports = function foundation(args, config) {
  const project = config.getProjectConfig();

  // Read data from the main application package.json
  // The keys used from the package are
  //  1. name: To use as name for the application wherever applicable
  //  2. version: To use as main app version
  //  3. dependencies: To link all the necessary libraries
  //  4: foundation: The plugin specific configuration, can override
  //                 name, version, provide other meta data, subModules,
  //                 constants (that can be platform specific)
  const pkg = JSON.parse(fs.readFileSync('./package.json'));

  // Get all the dependencies for this package that needs to be processed
  const dependencies = getDependencies(pkg);

  // Create the lock file
  LockFile.create(pkg, dependencies);

  // Initialize each platform for further processing
  const platFormProcessors = platforms.map(platform => platform(project, pkg, dependencies));

  // Execute all the stages for all the platforms;
  const stages = ['updateProject', 'hook'];
  stages.forEach((stage) => {
    platFormProcessors.forEach((p) => {
      p[stage]();
    });
  });

  // Create ios specific structure
  const iosProject = xcode.project(project.ios.pbxprojPath);
  iosProject.parseSync();
  const appDelegateItem = iosProject.pbxItemByComment('AppDelegate.m', 'PBXFileReference');
  const ios = {
    app: iosFilter(pkg.foundation, 'app'),
    subModules: iosFilter(pkg.foundation, 'sub-modules'),
    constants: flatten(iosFilter(pkg.foundation, 'constants'), '.'),
    folder: project.ios.sourceDir,
    pbxProject: iosProject,
    appDelegatePath: path.resolve(project.ios.sourceDir, appDelegateItem.path),
  };

  ios.appDelegate = generateAppDelegate(fs.readFileSync(ios.appDelegatePath).toString('utf-8'));

  // Create android specific structure
  const android = {
    app: androidFilter(pkg.foundation, 'app'),
    subModules: androidFilter(pkg.foundation, 'sub-modules'),
    constants: flatten(androidFilter(pkg.foundation, 'constants'), '.'),
    folder: project.android.sourceDir,
    manifestPath: project.android.manifestPath,
    projectGradlePath: project.android.settingsGradlePath.replace('settings.gradle', 'build.gradle'),
    appGradlePath: project.android.buildGradlePath,
    settingsGradlePath: project.android.settingsGradlePath,
    assetsPath: project.android.assetsPath,
    mainFilePath: project.mainFilePath,
    mainActivityPath: project.mainFilePath.replace('MainApplication.java', 'MainActivity.java'),
  };

  android.mainApplication = generateMainApplication(fs.readFileSync(android.mainFilePath).toString('utf-8'));
  android.mainActivity = generateMainActivity(fs.readFileSync(android.mainActivityPath).toString('utf-8'));
};
