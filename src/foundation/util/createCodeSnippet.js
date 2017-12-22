const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');

const escapeRegex = require('./escapeRegex');
const insertString = require('./insertString');

module.exports = function createCodeSnippet(name, commentPrefix) {
  const data = fs.readFileSync(path.resolve(__dirname, 'snippets', name)).toString('utf-8');

  // Search for header separator
  const match = /^--------------------------------------------------------------------------------$/m.exec(data);
  const snippet = match === null ? data : data.substr(match.index + match[0].length);
  const header = match === null ? '' : data.substring(0, match.index);
  const headers = {};

  if (header) {
    const r = /\s*([\w]*)\s*:\s*(.*)\s*/g;
    let m = r.exec(header);
    while (m !== null) {
      if (m[1]) {
        // eslint-disable-next-line prefer-destructuring
        headers[m[1]] = m[2];
      }

      m = r.exec(header);
    }
  }


  const id = uuid();
  const version = parseInt(headers.Version || '0', 10);
  const description = headers.Description || '';
  const signature = new RegExp(`^.*\\s+rnpm-plugin-foundation:${escapeRegex(name)} Snippet\\[([\\w\\-]*)\\]<([0-9]*)>`, 'm');
  const block = blockId => new RegExp(`BLOCK END \\[${escapeRegex(blockId)}\\]\\s*\\n`, 'm');
  const codeTemplate = `${commentPrefix} AUTO-GENERATED rnpm-plugin-foundation:${name} Snippet[${id}]<${version}>
${commentPrefix} ${description}
${commentPrefix} BLOCK BEGIN [${id}]
${snippet}
${commentPrefix} BLOCK END [${id}]
`;

  function createCodeBlock(dict) {
    if (!snippet) {
      // If no snippet, no code block, erases code block added by previous version as well
      return '';
    }

    if (!dict) {
      return codeTemplate;
    }

    return codeTemplate.replace(/{{[\w.]*}}/g, (m, key) => (
      dict[key]
    ));
  }

  return {
    apply(file, dict, insert) {
      function write(content) {
        console.log('Write ---', content, '---');
        fs.writeFileSync(file, content);
      }
      const content = fs.readFileSync(file).toString('utf-8');
      // Mechanism to remove the code block if no snippet has been provided
      // Useful for removing the snippet on later versions when the snippet
      // is not needed any more
      const codeBlock = createCodeBlock(dict);

      // Does the file contain the code block
      const signMatch = signature.exec(content);
      if (signMatch === null) {
        // The code block hasn't been added yet, insert it
        return write(insert(content, codeBlock));
      }

      // We have a matching signature, replace the content if the current snippet
      // version is higher than the existing snippet
      const signVersion = parseInt(signMatch[2], 10);
      const signId = signMatch[1];
      if (signVersion < version) {
        const blockMatch = block(signId).exec(content);
        if (!blockMatch) {
          throw new Error(`Could not find the block snippet for ${name} in ${file} with id ${signId}`);
        }

        return write(content.substring(0, signMatch.index)
          + codeBlock
          + content.substr(blockMatch.index + blockMatch[0].length));
      }

      return null;
    },

    applyAfter(file, regex, dict) {
      this.apply(file, dict, (source, part) => {
        const m = regex.exec(source);
        if (m === null) {
          throw new Error(`Could not update code snippet for ${name} at ${file}`);
        }
        return insertString(source, m.index + m[0].length, part);
      });
    },

    applyBefore(file, regex, dict) {
      this.apply(file, dict, (source, part) => {
        const m = regex.exec(source);
        if (m === null) {
          throw new Error(`Could not update code snippet for ${name} at ${file}`);
        }
        return insertString(source, m.index, part);
      });
    },
  };
};
