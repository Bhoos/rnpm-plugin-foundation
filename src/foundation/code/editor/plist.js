const fs = require('fs');
const plist = require('plist');

module.exports = function createPlistHandler(file) {
  let targetPath = file;

  const content = fs.readFileSync(file).toString('utf-8');

  const info = plist.parse(content);

  const generator = {
    set: (obj) => {
      Object.keys(obj).forEach((key) => {
        info[key] = obj[key];
      });
    },

    add: (name, value) => {
      if (!info[name]) {
        info[name] = [];
      }

      info[name].push(value);
    },

    info,
  };

  return {
    addMethod: (name, cb) => {
      generator[name] = (...args) => {
        cb(generator, ...args);
      };
    },

    getGenerator: () => generator,

    getContent() { return plist.build(info); },

    setTargetPath: (path) => { targetPath = path; },

    flush() {
      fs.writeFileSync(targetPath, this.getContent());
    },
  };
};
