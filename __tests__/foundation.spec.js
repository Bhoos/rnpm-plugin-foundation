const fs = require('fs');
const path = require('path');
const os = require('os');
const mkdirp = require('mkdirp');

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
    const tmpDir = path.resolve(os.tmpdir(), 'foundation');
    mkdirp.sync(tmpDir);

    const tmpFolder = fs.mkdtempSync(`${tmpDir}${path.sep}`);

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
  });
});
