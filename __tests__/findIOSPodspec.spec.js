jest.mock('fs');

const fs = require('fs');
const path = require('path');

const findIOSPodspec = require('../src/foundation/findIOSPodspec');

function mockFile(file, targetPath) {
  const content = fs.readFileSync(path.resolve(__dirname, 'mockedTemplates', file)).toString('utf-8');
  fs.__setMockContent(path.resolve(targetPath, file), content);
}

describe('findIOSPodspec.js', () => {
  it('must return an array of podspecs from node_modules', () => {
    const name = 'foundation-t';
    const pkgPath = path.resolve('node_modules', name);
    const iosPath = path.resolve(pkgPath, 'ios');

    fs.__setMockFiles(pkgPath, ['P1.podspec']);
    fs.__setMockFiles(iosPath, ['P2.podspec']);
    const res = findIOSPodspec(name);
    expect(res).toHaveLength(2);
    expect(res[0].name).toBe('P1');
    expect(res[1].name).toBe('P2');
    expect(res[0].path.endsWith(`/${name}/P1.podspec`)).toBe(true);
    expect(res[1].path.endsWith(`/${name}/ios/P2.podspec`)).toBe(true);
  });

  it('must return object with source files', () => {
    const name = 'foundation-test';
    const pkgPath = path.resolve('node_modules', name);

    fs.__setMockFiles(pkgPath, ['Foundation.xcodeproj']);
    const projPath = path.resolve(pkgPath, 'Foundation.xcodeproj');
    fs.__setMockFiles(projPath, ['project.pbxproj']);

    mockFile('project.pbxproj', projPath);

    const res = findIOSPodspec(name);
    expect(res).toHaveProperty('sourceFiles');
    expect(res.sourceFiles).toHaveLength(1);
    const f = res.sourceFiles[0].files;
    const p = res.sourceFiles[0].path;
    expect(p.endsWith('/node_modules/foundation-test')).toBe(true);
    expect(f).toHaveLength(6);
  });

  it('must return an array of podspecs', () => {
    const name = 'react-native-udp';
    const res = findIOSPodspec(name);
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe(name);
    expect(res[0].path.endsWith(`/libs/${name}/${name}.podspec`)).toBe(true);
  });
});
