const fs = require('fs');

const createCodeSnippet = require('../../util/createCodeSnippet');

const generateMainApplication = require('../../code/MainApplication.java');
const generateMainActivity = require('../../code/MainActivity.java');

const settingsGradle = createCodeSnippet('settings.gradle', '//');
const appBuildGradle = createCodeSnippet('app.build.gradle', '    //');

module.exports = {
  init({ android }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.settingsGradlePath = android.settingsGradlePath;
    this.buildGradlePath = android.buildGradlePath;
    const mainActivityPath = android.mainFilePath.replace('MainApplication', 'MainActivity');

    this.mainActivityFile = generateMainActivity(mainActivityPath);
    this.mainApplicationFile = generateMainApplication(android.mainFilePath);

    return Object.assign({
      code: {
        mainApplication: this.mainApplicationFile.getGenerator(),
        mainActivity: this.mainActivityFile.getGenerator(),
      },
    }, app);
  },

  updateProject() {
    // Change the settings.gradle file
    settingsGradle.applyBefore(
      this.settingsGradlePath,
      /include\s+':app'/m
    );

    appBuildGradle.applyAfter(
      this.buildGradlePath,
      /compile[\s(]+"com.facebook.react:react-native:.*".*\n/m
    );
  },

  flush() {
    this.mainApplicationFile.flush();
    this.mainActivityFile.flush();
  },
};
