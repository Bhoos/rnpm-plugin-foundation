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

    addUnique: (name, value) => {
      if (!info[name]) {
        info[name] = [];
      }

      if (!info[name].find(n => n === value)) {
        info[name].push(value);
      }
    },

    find: (name, cb) => {
      if (!info[name]) {
        return null;
      }

      return info[name].find(cb);
    },

    all: (name) => {
      if (!info[name]) {
        return [];
      }
      return info[name];
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
