const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

const createFromTemplate = require('../../util/createFromTemplate');

const generateAppDelegate = require('../../code/AppDelegate.m');
const generatePlist = require('../../code/Info.plist');
const generateEntitlements = require('../../code/Entitlements');

const generatePod = require('../../code/Podfile');

// const podFile = createCodeSnippet('Podfile', '  #');

module.exports = {
  init({ ios }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    const iosProject = xcode.project(ios.pbxprojPath);
    iosProject.parseSync();
    this.iosProject = iosProject;

    // Point to different info.plist file which is combined
    // using info.plist from the source project with the individual plist
    // files
    const config = iosProject.pbxXCBuildConfigurationSection();
    let developmentTeam = 'X-TEAMID-X';
    Object.keys(config).forEach((k) => {
      const c = config[k];
      if (c && c.buildSettings) {
        if (app.config.supportTablet) {
          c.buildSettings.TARGETED_DEVICE_FAMILY = '1,2';
        }

        if (c.buildSettings.INFOPLIST_FILE) {
          const p = path.resolve(ios.sourceDir, c.buildSettings.INFOPLIST_FILE);
          if (fs.existsSync(p)) {
            this.plistPath = p;
            this.plist = generatePlist(p);
          }
        }

        if (c.buildSettings.DEVELOPMENT_TEAM) {
          developmentTeam = c.buildSettings.DEVELOPMENT_TEAM;
        }

        if (c.buildSettings.CODE_SIGN_ENTITLEMENTS) {
          const p = path.resolve(ios.sourceDir, c.buildSettings.CODE_SIGN_ENTITLEMENTS);
          if (fs.existsSync(p)) {
            this.entitlementsPath = p;
            this.entitlements = generateEntitlements(this.entitlementsPath);
          }
        }
      }
    });

    // Search for the source path where the AppDelegate.m, Info.plist file are stored
    const appDelegateItem = this.iosProject.pbxItemByComment('AppDelegate.m', 'PBXFileReference');
    const appDelegatePath = path.resolve(ios.sourceDir, appDelegateItem.path);

    const targetPlist = this.plist.getGenerator();
    const entitlements = this.entitlements ? this.entitlements.getGenerator() : null;
    if (entitlements) {
      entitlements.developmentTeam = developmentTeam;
    }

    targetPlist.set({
      CFBundleDisplayName: app.config.name,
      CFBundleIdentifier: app.config.bundleId,
      CFBundleName: app.config.name,
      CFBundleShortVersionString: app.config.version,
      CFBundleVersion: app.config.buildNumber,
    });

    targetPlist.fullScreen(!!app.config.fullScreen);
    targetPlist.orientation(app.config.orientation);

    fs.writeFileSync(ios.pbxprojPath, iosProject.writeSync());

    this.targetName = this.iosProject.getFirstTarget().firstTarget.name;

    this.podFilePath = path.resolve(ios.sourceDir, 'Podfile');
    if (!fs.existsSync(this.podFilePath)) {
      createFromTemplate('Podfile', {
        project: this.targetName,
      }, this.podFilePath);
    }

    this.podfile = generatePod(this.podFilePath);
    this.appDelegateFile = generateAppDelegate(appDelegatePath);


    return Object.assign({
      sourceDir: ios.sourceDir,
      code: {
        appDelegate: this.appDelegateFile.getGenerator(),
      },
      podfile: this.podfile.getGenerator(),
      plist: targetPlist,
      entitlements,
    }, app);
  },

  updateProject() {

  },

  flush() {
    this.appDelegateFile.flush();
    this.plist.flush();
    if (this.entitlements) {
      this.entitlements.flush();
    }
    this.podfile.flush();
  },
};
