const fs = require('fs');

const escapeRegex = require('../../util/escapeRegex');
const insertString = require('../../util/insertString');
const createFromTemplate = require('../../util/createFromTemplate');

const comments = {
  signature: '// Automatically added by rnpm-plugin-foundation',
  blockStart: '// BEGIN - rnpm-plugin-foundation',
  blockEnd: '// END - rnpm-plugin-foundation',
};

module.exports = function fixSettingsGradle(filePath) {
  const content = fs.readFileSync(filePath).toString('utf-8');

  // Check if the file consists of the comment block, then ignore
  const regex = new RegExp(escapeRegex(comments.signature), 'm');
  if (regex.test(content)) {
    // Looks like the file has already been modified
    return;
  }

  // insert the code block before `include ':app'` line
  const match = /include\s+':app'/m.exec(content);
  if (match !== null) {
    fs.writeFileSync(
      filePath,
      insertString(content, match.index, createFromTemplate('settings.gradle', comments))
    );
  }
};
