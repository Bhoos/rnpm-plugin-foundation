const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

const createCodeSnippet = require('../../util/createCodeSnippet');
const createFromTemplate = require('../../util/createFromTemplate');

const generateAppDelegate = require('../../code/AppDelegate.m');
const generatePlist = require('../../code/Info.plist');

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
    this.plist = generatePlist(path.resolve(ios.sourceDir, infoPlist));
    const plistFile = 'RNFoundation-Info.plist';

    this.plist.setTargetPath(path.resolve(ios.sourceDir, plistFile));

    const targetPlist = this.plist.getGenerator();

    targetPlist.set({
      CFBundleDisplayName: '{{name}}',
      CFBundleIdentifier: '{{bundleId}}',
      CFBundleName: '{{name}}',
      CFBundleShortVersionString: '{{version}}',
      CFBundleVersion: '{{buildNumber}}',
    });

    targetPlist.fullScreen(!!app.config.fullScreen);
    targetPlist.orientation(app.config.orientation);

    // Point to different info.plist file which is combined
    // using info.plist from the source project with the individual plist
    // files
    const config = iosProject.pbxXCBuildConfigurationSection();
    Object.keys(config).forEach((k) => {
      const c = config[k];
      if (c && c.buildSettings && c.buildSettings.INFOPLIST_FILE) {
        if (app.config.supportTablet) {
          c.buildSettings.TARGETED_DEVICE_FAMILY = '1,2';
        }

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
      plist: targetPlist,
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
    this.plist.flush();
  },
};
