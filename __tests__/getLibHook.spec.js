jest.mock('fs');

const fs = require('fs');

const path = require('path');
const getLibHook = require('../src/foundation/getLibHook');


function createMockAndroid(name) {
  function mock(file, targetPath) {
    const content = fs.readFileSync(path.resolve(__dirname, 'mockedTemplates', file));
    fs.__setMockContent(path.resolve(targetPath, file), content);
  }

  const mainFolder = path.resolve('node_modules', name, 'android/app/src/main/');
  mock('AndroidManifest.xml', path.resolve(mainFolder));

  const srcPath = path.resolve(mainFolder, 'java/com/foundation/test');
  fs.__setMockFiles(srcPath, ['MainPackage.java', 'MainActivity.java']);
  mock('MainPackage.java', srcPath);
  mock('MainActivity.java', srcPath);
}

describe('getLibHook specification', () => {
  it('must return hook packages from libs/', () => {
    const pkg = {
      name: 'test-lib',
    };

    createMockAndroid(pkg.name);
    getLibHook(pkg);
  });
});
