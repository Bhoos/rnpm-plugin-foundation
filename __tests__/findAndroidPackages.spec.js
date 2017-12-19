jest.mock('fs');

const fs = require('fs');

const path = require('path');
const findAndroidPackages = require('../src/foundation/findAndroidPackages');


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

describe('findAndroidPackages', () => {
  it('must return an array of package information', () => {
    createMockAndroid('test-lib');
    const p = findAndroidPackages('test-lib');
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({
      name: 'MainPackage',
      packageName: 'com.foundation.test',
      fullName: 'com.foundation.test.MainPackage',
    });
    const pos = p[0].fullPath.lastIndexOf('/node_modules/');
    expect(pos).toBeGreaterThan(0);
    const filePath = p[0].fullPath.substr(pos);
    expect(filePath).toBe('/node_modules/test-lib/android/app/src/main/java/com/foundation/test/MainPackage.java');
  });

  it('must return an empty array for non-existent library', () => {
    const p = findAndroidPackages('non-existent');
    expect(p).toHaveLength(0);
  });
});
