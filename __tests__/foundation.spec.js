const path = require('path');
const foundation = require('../src/foundation');

describe('react-native foundation command', () => {
  let cwd = '';
  beforeAll(() => {
    // Store the current working directory, before anything starts
    cwd = process.cwd();
  });

  afterEach(() => {
    // Change back the current working directly to normal
    process.chdir(cwd);
  });

  it('validate with the mock project', () => {
    process.chdir(path.resolve(__dirname, 'mockProject'));

    foundation([], {
      getProjectConfig: () => ({
        android: {
          settingsGradlePath: path.resolve('android/settings.gradle'),
          buildGradlePath: path.resolve('android/app/build.gradle'),
          mainFilePath: path.resolve('android/app/MainApplication.java'),
        },
        ios: {
          sourceDir: path.resolve('ios'),
          pbxprojPath: path.resolve('ios', 'project.pbxproj'),
        },
      }),
    });
  });
});
