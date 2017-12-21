const fixSettingsGradle = require('./fix.settings.gradle');
const fixAppBuildGradle = require('./fix.app.build.gradle');

module.exports = {
  updateProject({ android }, app, dependencies) {
    // Change the settings.gradle file
    fixSettingsGradle(android.settingsGradlePath);
    fixAppBuildGradle(android.buildGradlePath);
  },

  hook(app, constants, subModules, dependency) {

  },
};
