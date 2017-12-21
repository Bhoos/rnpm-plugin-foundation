const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

const generateAppDelegate = require('../../code/AppDelegate.m');

module.exports = {
  init({ ios }, app, dependencies) {
    this.iosProject = xcode.project(ios.pbxprojPath);
    this.iosProject.parseSync();

    const appDelegateItem = this.iosProject.pbxItemByComment('AppDelegate.m', 'PBXFileReference');
    const appDelegatePath = path.resolve(ios.sourceDir, appDelegateItem.path);
    this.appDelegate = generateAppDelegate(fs.readFileSync(appDelegatePath).toString('utf-8'));
  },

  updateProject() {

  },

  hook(dependency) {

  },
};
