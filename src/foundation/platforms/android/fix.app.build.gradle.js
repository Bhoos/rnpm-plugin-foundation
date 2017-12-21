const fs = require('fs');

const escapeRegex = require('../../util/escapeRegex');
const insertString = require('../../util/insertString');
const createFromTemplate = require('../../util/createFromTemplate');

const comments = {
  signature: '// Automatically added by rnpm-plugin-foundation - auto include libs',
  blockStart: '// BEGIN - rnpm-plugin-foundation',
  blockEnd: '//END - rnpm-plugin-foundation',
};

module.exports = function fixAppBuildGradle(filePath) {
  const content = fs.readFileSync(filePath).toString('utf-8');

  // Do not add the snipped if it already exists
  const regex = new RegExp(escapeRegex(comments.signature), 'm');
  if (regex.text(content)) {
    return;
  }

  // insert the code block after compile react-native
  const match = /compile[\s(]+"com.facebook.react:react-native:.*".*\n/m.exec(content);
  if (match === null) {
    throw new Error('Could not update app build.gradle');
  }

  fs.writeFileSync(
    filePath,
    insertString(
      content,
      match.index + match[0].length,
      createFromTemplate('app.build.gradle', comments)
    )
  );
};
