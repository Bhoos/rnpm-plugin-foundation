const fs = require('fs');
const escapeRegex = require('./_escapeRegex');

const importRegex = h => new RegExp(`^import\\s+${escapeRegex(h)};`, 'm');

const methodBodyRegex = (returnType, name, params, modifier) => {
  const start = `^\\s*${escapeRegex(modifier)}\\s+${escapeRegex(returnType)}\\s+${escapeRegex(name)}\\s*\\(`;
  const mid = params.map(p => (
    `\\s*${escapeRegex(p.type)}\\s*(\\w+)\\s*`
  )).join(',');
  const end = '\\)\\s*\\{';
  return new RegExp(`${start}${mid}${end}`, 'm');
};

module.exports = function createJavaHandler(file) {
  let content = fs.readFileSync(file).toString('utf-8');

  let headerInsertPos = 0;
  let propInsertPos = 0;

  const insertContent = (pos, insert) => {
    content = content.substring(0, pos) + insert + content.substr(pos);

    if (pos < propInsertPos) {
      propInsertPos += insert.length;
    }

    if (pos < headerInsertPos) {
      headerInsertPos += insert.length;
    }
  };

  function getMethodBody(startPos) {
    let blocks = 1;
    let inLineComment = false;
    let inComment = false;
    let inString = false;
    let escape = false;
    let lastChar = '';
    for (let i = startPos; i < content.length; i += 1) {
      const ch = content[i];
      if (escape) {
        escape = false;
      // Skip within comments and strings
      } else if (inString) {
        if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else if (inComment) {
        if (ch === '/' && lastChar === '*') {
          inComment = false;
        }
      } else if (inLineComment) {
        if (ch === '\n') {
          inLineComment = false;
        }
      } else {
        // eslint-disable-next-line
        if (ch === '*' && lastChar === '\/') {
          inComment = true;
        } else if (ch === '/' && lastChar === '/') {
          inLineComment = true;
        } else if (ch === '"') {
          inString = true;
        } else if (ch === '{') {
          blocks += 1;
        } else if (ch === '}') {
          blocks -= 1;
          if (blocks === 0) {
            return content.substring(startPos, i);
          }
        }
      }
      lastChar = ch;
    }

    return null;
  }

  const rClass = /^public\s+class\s+[^{]*\{/mg;
  if (rClass.exec(content) !== null) {
    propInsertPos = rClass.lastIndex;
  }

  // Search for the last import call in the source file, and use
  // it as a insert point
  const rimport = /^import\s+[\w.]+;/gm;
  while (rimport.exec(content) !== null) {
    headerInsertPos = rimport.lastIndex;
  }

  const generator = {
    import: (name) => {
      // Make sure there is no import for the given name
      if (!importRegex(name).test(content)) {
        const header = `\nimport ${name};`;
        insertContent(headerInsertPos, header);
        headerInsertPos += header.length;
      }
    },
    addProperty: (modifier, type, name, value) => {
      const propRegex = new RegExp(`\\s*${modifier}\\s+${type}\\s+${name}`);
      if (propRegex.test(content)) {
        // Property is already there, don't add again
        return;
      }

      const prop = `\n  // Auto-generated property rnpm-plugin-foundation\n  ${modifier} ${type} ${name} = ${value};\n`;
      insertContent(propInsertPos, prop);
      propInsertPos += prop.length;
    },

    addReactPackage: (pkg) => {
      if (content.includes(`new ${pkg}`)) {
        // Looks like the package is already added, don't add again
        return;
      }

      const n = `,\n        new ${pkg}`;
      const r = /new\s+MainReactPackage\(\s*\)/g;
      if (r.exec(content) !== null) {
        insertContent(r.lastIndex, n);
      }
    },
  };

  return {
    getGenerator: () => generator,

    getContent: () => content,

    flush: () => fs.writeFileSync(file, content),

    addMethod(name, modifier, returnType, returnValue = null, override = true) {
      const params = [];
      const fn = (...args) => {
        if (args.length > 0) {
          // Adding a parameter, must be two parameters
          params.push({
            name: args[0],
            type: args[1],
          });
          return fn;
        }

        // Add the method to the generator
        generator[name] = (caller, callArgs) => {
          // If the given method doesn't exist add one
          const mRegex = methodBodyRegex(returnType, name, params, modifier);
          const match = mRegex.exec(content);
          let paramNames = params.map(p => p.name);

          let methodBody = null;
          if (match) {
            methodBody = getMethodBody(match.index + match[0].length);
            // Search for the caller within the body, in which case assume the code has
            // already been added
            if (methodBody.includes(caller)) {
              return;
            }

            paramNames = match.slice(1, params.length + 1);
          }

          let callingArgs = `${name}(${paramNames.join(', ')})`;
          if (callArgs) {
            callingArgs = `${callArgs(...params)}`;
          }

          // the calling code
          const call = `\n    // Auto-generated call (rnpm-plugin-foundation)${returnValue === null ? '\n    handled = handled || ' : '\n    '}${caller}.${callingArgs};\n`;
          if (!match) {
            let method = '\n  // Auto-generate method signature (rnpm-plugin-foundation)\n';
            if (override) {
              method += '  @Override\n';
            }
            method += `  ${modifier} ${returnType} ${name}(`;
            method += params.map(p => `${p.type} ${p.name}`).join(', ');
            method += ') {';
            if (override) {
              method += `\n    super.${name}(${paramNames.join(', ')});`;
            }

            if (returnValue === null) {
              method += '\n    boolean handled = false;';
            }

            if (caller) {
              method += `${call}`;
            } else {
              method += '\n';
            }

            if (returnValue !== '') {
              method += `\n\n    return ${returnValue === null ? 'handled' : returnValue};`;
            }
            method += '  }\n\n';

            const idx = content.lastIndexOf('}');
            if (idx >= 0) {
              insertContent(idx, method);
            }
          } else if (returnValue === null) {
            // Insert the call just before the return
            // The method was found at match.index
            // Seach fro return within the method
            if (caller) {
              const method = methodBody;
              const methodPos = match.index;
              const ret = /^\s+return.*;/m.exec(method);
              if (ret) {
                const insertPos = methodPos + (ret.index);
                insertContent(insertPos, call);
              }
            }
          } else {
            // Insert the call just after the method signature
            // And after the super call
            // eslint-disable-next-line no-lonely-if
            if (caller) {
              const method = methodBody;
              const methodPos = match.index;
              let insertPos = methodPos + match[0].length;
              const r = /^\s*super\.[^;]+;/m;

              const sup = r.exec(method);
              if (sup !== null) {
                insertPos += sup[0].length + r.lastIndex;
              }

              insertContent(insertPos, call);
            }
          }
        };

        return generator;
      };
      return fn;
    },
  };
};
