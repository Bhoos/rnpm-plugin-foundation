const escapeRegex = require('./_escapeRegex');

const importRegex = h => new RegExp(`^\\s*#import\\s*${escapeRegex(h)}`, 'm');
const methodBodyRegex = (returnType, ids) => {
  const start = `^\\s*-\\s*\\(\\s*${escapeRegex(returnType)}\\s*\\)\\s*`;
  const mid = ids.reduce((res, { name }) => (
    `${res}${escapeRegex(name)}:\\s*\\(.*\\)(\\w+)\\W*`
  ), '');
  const end = '\\{([\\s\\S]*)\\}';
  return new RegExp(`${start}${mid}${end}`, 'm');
};

module.exports = function createCodeGenerator(sourceContent) {
  let content = sourceContent;

  let headerInsertPos = 0;

  // Search for the last import call in the source file, and use
  // it as pivot point
  const rimport = /^\s*#import\W+.*$/gm;
  while (rimport.exec(content) !== null) {
    headerInsertPos = rimport.lastIndex;
  }
  const codeGenerator = {
    import: (name) => {
      // Make sure there is no import for the given name
      if (!importRegex(name).test(content)) {
        // header not found, insert
        const header = `\n#import ${name}`;
        content = content.substring(0, headerInsertPos) + header + content.substr(headerInsertPos);
      }
    },
  };

  return {
    getGenerator: () => codeGenerator,

    getContent: () => content,

    addMethod(name, returnType, returnValue = null) {
      const ids = [];
      const fn = (...args) => {
        if (args.length === 0) {
          codeGenerator[name] = (caller, callArgs) => {
            // If the given method body doesn't exist add one
            const mRegex = methodBodyRegex(returnType, ids);
            const match = mRegex.exec(content);
            let params = ids.map(id => id.param);
            if (match) {
              // eslint-disable-next-line
              const body = match[match.length - 1];
              // Search for the caller within the body, in which case, we can assume the code
              // has been added
              if (body.includes(caller)) {
                return;
              }
              params = match.slice(1, ids.length + 1);
            }

            let callingArgs = ids.reduce((res, id) => (
              `${res} ${id.name}:${id.param}`
            ), '');
            if (callArgs) {
              callingArgs = ` ${callArgs(...params)}`;
            }

            // the calling code
            const call = `\n  // Auto-generated call (rnpm-plugin-foundation)${returnValue === null ? '\n  handled = handled || ' : '\n  '}[${caller}${callingArgs}];\n`;
            if (!match) {
              let method = '// Auto-generated method signature (rnpm-plugin-foundation)\n';
              method += ids.reduce((res, id) => `${res}${id.name}:(${id.type})${id.param} `, `- (${returnType})`);
              method += '{';
              if (returnValue === null) {
                method += '\n  BOOL handled = NO;';
              }
              method += `${call}`;
              if (returnValue !== '') {
                method += `\n\n  return ${returnValue === null ? 'handled' : returnValue};`;
              }
              method += '\n}\n\n';
              const m = /@end/.exec(content);
              if (m) {
                content = content.substring(0, m.index) + method + content.substr(m.index);
              }
            } else if (returnValue === null) {
              // Insert the call just before the return
              // The method was found at match.index
              // Search for return within the method
              const method = match[0];
              const methodPos = match.index;
              const ret = /^\s+return.*;/m.exec(method);
              if (ret) {
                const insertPos = methodPos + (ret.index);
                content = content.substring(0, insertPos) + call + content.substr(insertPos);
              }
            } else {
              // Insert the call just after the method signature
              const method = match[0];
              const methodPos = match.index;
              const pos = method.indexOf('{');
              if (pos >= 0) {
                const insertPos = methodPos + pos + 1;
                content = content.substring(0, insertPos) + call + content.substr(insertPos);
              }
            }
          };
          return codeGenerator;
        }

        ids.push({
          name: args[0],
          type: args[1],
          param: args[2] || args[0],
        });
        return fn;
      };
      return fn;
    },
  };
};
