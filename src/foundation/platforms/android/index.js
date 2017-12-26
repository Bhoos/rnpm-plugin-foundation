const path = require('path');

const createCodeSnippet = require('../../util/createCodeSnippet');

const generateMainApplication = require('../../code/MainApplication.java');
const generateMainActivity = require('../../code/MainActivity.java');
const generateAppBuildGradle = require('../../code/app.build.gradle');

const settingsGradle = createCodeSnippet('settings.gradle', '//');
const projectGradle = createCodeSnippet('project.build.gradle', '//');

const appDeclarationBuildGradle = createCodeSnippet('app.declaration.build.gradle', '//');
const appDependenciesBuildGradle = createCodeSnippet('app.dependencies.build.gradle', '    //');
const appManifestBuildGradle = createCodeSnippet('app.manifest.build.gradle', '            //');

module.exports = {
  init({ android }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.settingsGradlePath = android.settingsGradlePath;
    this.projectGradlePath = path.resolve(path.dirname(android.settingsGradlePath), 'build.gradle');
    this.buildGradlePath = android.buildGradlePath;
    const mainActivityPath = android.mainFilePath.replace('MainApplication', 'MainActivity');

    this.mainActivityFile = generateMainActivity(mainActivityPath);
    this.mainApplicationFile = generateMainApplication(android.mainFilePath);

    this.appBuildGradle = generateAppBuildGradle(android.buildGradlePath);

    return Object.assign({
      code: {
        mainApplication: this.mainApplicationFile.getGenerator(),
        mainActivity: this.mainActivityFile.getGenerator(),
      },
    }, app);
  },

  updateProject() {
    const appBuildGradle = this.appBuildGradle.getGenerator();
    appBuildGradle.applicationId('foundation.constants.android.bundleId');
    appBuildGradle.versionCode('foundation.constants.android.buildNumber');
    appBuildGradle.versionName('foundation.constants.android.version');
    this.appBuildGradle.flush();

    // Change the settings.gradle file
    settingsGradle.applyBefore(
      this.settingsGradlePath,
      /include\s+':app'/m
    );

    projectGradle.applyAfter(this.projectGradlePath);

    appDeclarationBuildGradle.applyAfter(
      this.buildGradlePath,
      /import com.android.build.OutputFile[^\n]*\n/m
    );

    appDependenciesBuildGradle.applyAfter(
      this.buildGradlePath,
      /compile[\s(]+"com.facebook.react:react-native:.*".*\n/m
    );

    appManifestBuildGradle.applyAfter(
      this.buildGradlePath,
      /\s+variant.outputs.each \{ output ->\s*\n/m
    );
  },

  flush() {
    this.mainApplicationFile.flush();
    this.mainActivityFile.flush();
  },
};
