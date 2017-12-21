const fs = require('fs');

const fixSettingsGradle = require('./fix.settings.gradle');
const fixAppBuildGradle = require('./fix.app.build.gradle');

const generateMainApplication = require('../../code/MainApplication.java');
const generateMainActivity = require('../../code/MainActivity.java');

module.exports = {
  init({ android }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.settingsGradlePath = android.settingsGradlePath;
    this.buildGradlePath = android.buildGradlePath;
    this.mainApplication = generateMainApplication(fs.readFileSync(android.mainFilePath).toString('utf-8'));
    const mainActivityPath = android.mainFilePath.replace('MainApplication', 'MainActivity');
    this.mainActivity = generateMainActivity(fs.readFileSync(mainActivityPath));
  },

  updateProject() {
    // Change the settings.gradle file
    fixSettingsGradle(this.settingsGradlePath);
    fixAppBuildGradle(this.buildGradlePath);
  },

  hook(dependency) {
    // Hook each dependency
  },
};
