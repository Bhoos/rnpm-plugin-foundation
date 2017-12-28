const path = require('path');

const createCodeSnippet = require('../../util/createCodeSnippet');

const generateMainApplication = require('../../code/MainApplication.java');
const generateMainActivity = require('../../code/MainActivity.java');
const generateAppBuildGradle = require('../../code/app.build.gradle');
const generateManifest = require('../../code/AndroidManifest.xml');

const settingsGradle = createCodeSnippet('settings.gradle', '//');
const projectGradle = createCodeSnippet('project.build.gradle', '//');

const appDeclarationBuildGradle = createCodeSnippet('app.declaration.build.gradle', '//');
const appDependenciesBuildGradle = createCodeSnippet('app.dependencies.build.gradle', '    //');
const appManifestBuildGradle = createCodeSnippet('app.manifest.build.gradle', '            //');

const fullScreenCode = createCodeSnippet('fullScreen.java', '    //');

module.exports = {
  init({ android }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.settingsGradlePath = android.settingsGradlePath;
    this.projectGradlePath = path.resolve(path.dirname(android.settingsGradlePath), 'build.gradle');
    this.buildGradlePath = android.buildGradlePath;
    const mainActivityPath = android.mainFilePath.replace('MainApplication', 'MainActivity');

    this.mainActivityPath = mainActivityPath;
    this.mainActivityFile = generateMainActivity(mainActivityPath);
    this.mainApplicationFile = generateMainApplication(android.mainFilePath);
    this.appBuildGradle = generateAppBuildGradle(android.buildGradlePath);

    // Check for app configuration (fullScreen, orientation, etc)
    if (app.config.fullScreen) {
      // Make sure there is a onWindowFocusChanged method in MainActivity
      this.mainActivityFile.getGenerator().onWindowFocusChanged(null);
    }

    return generateManifest(android.manifestPath).then((manifest) => {
      manifest.setTargetPath(path.resolve(android.sourceDir, '..', 'RNFoundation-AndroidManifest.xml'));
      this.manifest = manifest;

      if (app.config.metaData) {
        Object.keys(app.config.metaData).forEach((name) => {
          manifest.getGenerator().metaData(name, app.config.metaData[name]);
        });
      }

      return Object.assign({
        code: {
          mainApplication: this.mainApplicationFile.getGenerator(),
          mainActivity: this.mainActivityFile.getGenerator(),
        },
        manifest: this.manifest.getGenerator(),
      }, app);
    });
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

    this.manifest.flush();

    if (this.app.config.fullScreen) {
      // Add the code snippet
      fullScreenCode.applyAfter(
        this.mainActivityPath,
        /super\.onWindowFocusChanged\(hasFocus\);\s*\n/m
      );
    }
  },
};
