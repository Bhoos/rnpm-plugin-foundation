const fs = require('fs');
const path = require('path');
const os = require('os');
const rimraf = require('rimraf');

const flatten = require('../src/foundation/util/flatten');
const foundation = require('../src/foundation');

function recursiveCopy(target, source) {
  const files = fs.readdirSync(source);
  files.forEach((f) => {
    const cur = path.resolve(source, f);
    const t = path.resolve(target, f);
    if (fs.lstatSync(cur).isDirectory()) {
      fs.mkdirSync(t);
      recursiveCopy(t, cur);
    } else {
      fs.copyFileSync(cur, t);
    }
  });
}

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
    // Create a temporary folder to clone the mock project
    const tmpFolder = path.resolve(os.tmpdir(), 'foundation');
    rimraf.sync(tmpFolder);
    fs.mkdirSync(tmpFolder);

    console.log('Creating project clone at', `${tmpFolder}`);
    recursiveCopy(tmpFolder, path.resolve(__dirname, 'mockProject'));
    process.chdir(tmpFolder);

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

    // Check all the files to match for the snapshot
    const filesToCheck = {
      'foundation.lock': true,
      android: {
        'settings.gradle': true,
        app: {
          'build.gradle': true,
          'MainActivity.java': true,
          'MainApplication.java': true,
        },
      },
      ios: {
        'project.pbxproj': true,
        MockProject: {
          'AppDelegate.m': true,
        },
      },
    };

    Object.keys(flatten(filesToCheck, path.sep)).forEach((f) => {
      expect(fs.readFileSync(path.resolve(tmpFolder, f)).toString('utf-8')).toMatchSnapshot();
    });
  });
});
