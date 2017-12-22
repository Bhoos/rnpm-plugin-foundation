/* eslint-disable function-paren-newline */

const androidCodeEditor = require('./editor/java');

module.exports = function mainApplication(file) {
  const editor = androidCodeEditor(file);

  editor
    .addMethod('onCreate', 'public', 'void', '', true)();

  return editor;
};
