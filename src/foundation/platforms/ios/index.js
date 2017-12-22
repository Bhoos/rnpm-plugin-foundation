const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

const createCodeSnippet = require('../../util/createCodeSnippet');
const createFromTemplate = require('../../util/createFromTemplate');

const generateAppDelegate = require('../../code/AppDelegate.m');

const podFile = createCodeSnippet('Podfile', '  #');

module.exports = {
  init({ ios }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.iosProject = xcode.project(ios.pbxprojPath);
    this.iosProject.parseSync();

    this.targetName = this.iosProject.getFirstTarget().firstTarget.name;

    this.podFilePath = path.resolve(ios.sourceDir, 'Podfile');

    const appDelegateItem = this.iosProject.pbxItemByComment('AppDelegate.m', 'PBXFileReference');
    const appDelegatePath = path.resolve(ios.sourceDir, appDelegateItem.path);

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
