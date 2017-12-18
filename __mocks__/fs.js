const fs = require.requireActual('fs');

const origExists = fs.existsSync;
const origRead = fs.readFileSync;
const origDir = fs.readdirSync;

const mockedContent = {};
const mockedDirectory = {};

fs.__setMockFiles = (path, files) => {
  mockedDirectory[path] = files;
};

fs.__setMockContent = (path, content) => {
  mockedContent[path] = content;
};

fs.readdirSync = (path, options) => {
  if (mockedDirectory[path]) {
    return mockedDirectory[path];
  }

  return origDir(path, options);
};

fs.readFileSync = (path, options) => {
  if (mockedContent[path]) {
    return mockedContent[path];
  }

  return origRead(path, options);
};

fs.existsSync = (path) => {
  if (mockedContent[path]) {
    return mockedContent[path];
  }

  return origExists(path);
};

module.exports = fs;
