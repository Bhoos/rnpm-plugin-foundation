const fs = require('fs');

module.exports = function createGenericHandler(file) {
  let content = fs.readFileSync(file).toString('utf-8');

  const generator = {

  };

  return {
    addReplacer: (name, regex) => {
      generator[name] = (...args) => {
        content = content.replace(regex, (match, ...pArgs) => {
          let res = match;
          for (let i = 0; i < args.length; i += 1) {
            res = res.replace(pArgs[i], args[i]);
          }
          return res;
        });
      };
    },

    getGenerator: () => generator,

    getContent: () => content,

    flush: () => fs.writeFileSync(file, content),
  };
};
