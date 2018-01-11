const path = require('path');

const createCodeSnippet = require('../../util/createCodeSnippet');

const generateMainApplication = require('../../code/MainApplication.java');
const generateMainActivity = require('../../code/MainActivity.java');
const generateAppBuildGradle = require('../../code/app.build.gradle');
const generateManifest = require('../../code/AndroidManifest.xml');
const generateProjectBuildGradle = require('../../code/project.build.gradle');
const generateSettingsGradle = require('../../code/settings.gradle');

// const settingsGradle = createCodeSnippet('settings.gradle', '//');
const projectGradle = createCodeSnippet('project.build.gradle', '//');

// const appDeclarationBuildGradle = createCodeSnippet('app.declaration.build.gradle', '//');
// const appDependenciesBuildGradle = createCodeSnippet('app.dependencies.build.gradle', '    //');
// const appManifestBuildGradle = createCodeSnippet('app.manifest.build.gradle', '            //');

const fullScreenCode = createCodeSnippet('fullScreen.java', '    //');
const bundleSignatureGradle = createCodeSnippet('bundle-signature.gradle', '//');
const validateSignatureJava = createCodeSnippet('validate-signature.java', '  //');

module.exports = {
  init({ android }, app, dependencies) {
    this.app = app;
    this.dependencies = dependencies;

    this.settingsGradlePath = android.settingsGradlePath;
    this.projectGradlePath = path.resolve(path.dirname(android.settingsGradlePath), 'build.gradle');
    this.buildGradlePath = android.buildGradlePath;
    const mainActivityPath = android.mainFilePath.replace('MainApplication', 'MainActivity');

    this.mainFilePath = android.mainFilePath;
    this.mainActivityPath = mainActivityPath;

    this.mainActivityFile = generateMainActivity(mainActivityPath);
    this.mainApplicationFile = generateMainApplication(android.mainFilePath);
    this.appBuildGradle = generateAppBuildGradle(android.buildGradlePath);
    this.projectBuildGradle = generateProjectBuildGradle(this.projectGradlePath);
    this.settingsGradle = generateSettingsGradle(this.settingsGradlePath);

    // Check for app configuration (fullScreen, orientation, etc)
    if (app.config.fullScreen) {
      // View is required for fullScreen
      this.mainActivityFile.getGenerator().import('android.view.View');
      // Make sure there is a onWindowFocusChanged method in MainActivity
      this.mainActivityFile.getGenerator().onWindowFocusChanged(null);
    }

    const appBuildGradle = this.appBuildGradle.getGenerator();
    appBuildGradle.config({
      applicationId: JSON.stringify(this.app.config.bundleId),
      versionCode: JSON.stringify(parseInt(this.app.config.buildNumber, 10)),
      versionName: JSON.stringify(this.app.config.version),
    });

    return generateManifest(android.manifestPath).then((manifest) => {
      this.manifest = manifest;

      if (app.config.fullScreen) {
        manifest.getGenerator().fullScreen(app.config.fullScreen);
      }

      if (app.config.orientation) {
        manifest.getGenerator().orientation(app.config.orientation);
      }

      if (app.config.metaData) {
        Object.keys(app.config.metaData).forEach((name) => {
          manifest.getGenerator().metaData(name, app.config.metaData[name]);
        });
      }

      if (app.config.signBundle) {
        manifest.getGenerator().metaData('BUNDLE-SIGNATURE', '--UNIQUE-BUNDLE-SIGNATURE--');

        const m = this.mainApplicationFile.getGenerator();
        m.onCreate('this', () => 'validateSignature()');
        m.import('android.content.pm.ApplicationInfo');
        m.import('android.content.pm.PackageManager');
        m.import('java.io.IOException');
        m.import('java.io.InputStream');
        m.import('java.math.BigInteger');
        m.import('java.security.MessageDigest');
        m.import('java.security.NoSuchAlgorithmException');
      }

      return Object.assign({
        sourceDir: android.sourceDir,
        code: {
          mainApplication: this.mainApplicationFile.getGenerator(),
          mainActivity: this.mainActivityFile.getGenerator(),
        },
        appGradle: appBuildGradle,
        projectGradle: this.projectBuildGradle.getGenerator(),
        settingsGradle: this.settingsGradle.getGenerator(),
        manifest: this.manifest.getGenerator(),
      }, app);
    });
  },

  updateProject() {
    // // Change the settings.gradle file
    // settingsGradle.applyBefore(
    //   this.settingsGradlePath,
    //   /include\s+':app'/m
    // );

    // projectGradle.applyAfter(this.projectGradlePath);

    // appDeclarationBuildGradle.applyAfter(
    //   this.buildGradlePath,
    //   /import com.android.build.OutputFile[^\n]*\n/m
    // );

    // appDependenciesBuildGradle.applyAfter(
    //   this.buildGradlePath,
    //   /compile[\s(]+"com.facebook.react:react-native:.*".*\n/m
    // );

    // appManifestBuildGradle.applyAfter(
    //   this.buildGradlePath,
    //   /\s+variant.outputs.each \{ output ->\s*\n/m
    // );
  },

  flush() {
    this.mainApplicationFile.flush();
    this.mainActivityFile.flush();

    this.appBuildGradle.flush();
    this.manifest.flush();
    this.settingsGradle.flush();
    this.projectBuildGradle.flush();

    if (this.app.config.signBundle) {
      const salt = { SALT: this.app.config.signBundle };
      bundleSignatureGradle.applyBefore(
        this.buildGradlePath,
        /^dependencies\s*\{/m,
        salt
      );
      validateSignatureJava.applyBefore(
        this.mainFilePath,
        /\s*private final ReactNativeHost/m,
        salt
      );
    }

    if (this.app.config.fullScreen) {
      // Add the code snippet
      fullScreenCode.applyAfter(
        this.mainActivityPath,
        /super\.onWindowFocusChanged\(hasFocus\);\s*\n/m
      );
    }

    projectGradle.applyAfter(this.projectGradlePath);
  },
};
