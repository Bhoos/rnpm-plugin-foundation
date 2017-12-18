const fs = jest.genMockFromModule('fs');

const orig = fs.readFileSync;
const mocks = {};

fs.__setMockContent = (path, content) => {
  mocks[path] = content;
};

fs.readFileSync = path => mocks[path] || orig(path);
