const fs = require('fs');
const escapeRegex = require('../../util/escapeRegex');

module.exports = function createGenericHandler(file) {
  let content = fs.readFileSync(file).toString('utf-8');
  function replaceContent(pos, replaceLength, replacement) {
    content = content.substring(0, pos) +
                replacement +
                content.substr(pos + replaceLength);
  }

  function insertContent(pos, part) {
    replaceContent(pos, 0, part);
  }

  const generator = {
    addAttribute(tag, name, defaultValue) {
      const r = `<${escapeRegex(tag)}\\s+[^>]*${escapeRegex(name)}="([^"]*)"[^>]*>`;
      const regex = new RegExp(r, 'mg');
      const match = regex.exec(content);
      if (match !== null) {
        const p = match[0].indexOf(match[1]);
        replaceContent(match.index + p, match[1].length, defaultValue);
      } else {
        // the attribute is not there in the manifest
        const r2 = new RegExp(`<${escapeRegex(tag)}\\s+[^>]*>`, 'mg');
        const m = r2.exec(content);
        if (m !== null) {
          insertContent(m.index + (m[0].length - 1), ` ${name}="${defaultValue}"`);
        }
      }
    },
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
