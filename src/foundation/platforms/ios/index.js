const fs = require('fs');
const path = require('path');
const xcode = require('xcode');
const plist = require('plist');

const createCodeSnippet = require('../../util/createCodeSnippet');
const createFromTemplate = require('../../util/createFromTemplate');

const generateAppDelegate = require('../../code/AppDelegate.m');

const podFile = createCodeSnippet('Podfile', '  #');

module.exports = {
  init({ ios }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    const iosProject = xcode.project(ios.pbxprojPath);
    iosProject.parseSync();
    this.iosProject = iosProject;

    // Search for the source path where the AppDelegate.m, Info.plist file are stored
    const appDelegateItem = this.iosProject.pbxItemByComment('AppDelegate.m', 'PBXFileReference');
    const appDelegatePath = path.resolve(ios.sourceDir, appDelegateItem.path);
    const infoPlist = `${path.dirname(appDelegateItem.path)}/${'Info.plist'}`;
    const infoPlistPath = path.resolve(ios.sourceDir, infoPlist);
    const targetPlist = plist.parse(fs.readFileSync(infoPlistPath).toString('utf-8'));
    const plistFile = 'RNFoundation-Info.plist';
    const plistPath = path.resolve(ios.sourceDir, plistFile);

    // Update the targetPlist with appropriate app specific constants
    targetPlist.CFBundleDisplayName = '{{.name}}';
    targetPlist.CFBundleIdentifier = '{{.bundleId}}';
    targetPlist.CFBundleName = '{{.name}}';
    targetPlist.CFBundleShortVersionString = '{{.version}}';
    targetPlist.CFBundleVersion = '{{.buildNumber}}';

    dependencies.forEach((d) => {
      if (d.plist) {
        const pl = plist.parse(fs.readFileSync(d.plist).toString('utf-8'));
        Object.keys(pl).forEach((key) => {
          const value = pl[key];
          if (targetPlist[key] === undefined) {
            targetPlist[key] = pl[key];
          } else if (!Array.isArray(value)) {
            throw new Error(`Invalid plist value for ${key} in ${d.package.name} expected array`);
          } else if (!Array.isArray(targetPlist[key])) {
            throw new Error(`Invalid plist key type ${key}. Cannot override for ${d.package.name}. Must be an array to append.`);
          } else {
            targetPlist[key] = targetPlist[key].concat(value);
          }
        });
      }
    });

    // Write the new Plist file
    fs.writeFileSync(plistPath, plist.build(targetPlist));

    // Point to different info.plist file which is combined
    // using info.plist from the source project with the individual plist
    // files
    const config = iosProject.pbxXCBuildConfigurationSection();
    Object.keys(config).forEach((k) => {
      const c = config[k];
      if (c && c.buildSettings && c.buildSettings.INFOPLIST_FILE) {
        if (c.buildSettings.INFOPLIST_FILE === infoPlist) {
          c.buildSettings.INFOPLIST_FILE = plistFile;
        }
      }
    });

    fs.writeFileSync(ios.pbxprojPath, iosProject.writeSync());

    this.targetName = this.iosProject.getFirstTarget().firstTarget.name;

    this.podFilePath = path.resolve(ios.sourceDir, 'Podfile');

    this.appDelegateFile = generateAppDelegate(appDelegatePath);

    return Object.assign({
      code: {
        appDelegate: this.appDelegateFile.getGenerator(),
      },
    }, app);
  },

  updateProject() {
    // Create a pod file if it doesn't exist
    if (!fs.existsSync(this.podFilePath)) {
      const dict = {
        project: this.targetName,
      };
      createFromTemplate('Podfile', dict, this.podFilePath);
    }

    // Add the code snippet
    // Apply the snippet after within the main target
    // (after use_frameworks declaration if available);
    podFile.applyAfter(
      this.podFilePath,
      new RegExp(`target '${this.targetName}' do\\s*\\n(([\\w\\W]*?use_frameworks\\!\\s*\\n){0,1})`, 'm')
    );
  },

  flush() {
    this.appDelegateFile.flush();
  },
};
