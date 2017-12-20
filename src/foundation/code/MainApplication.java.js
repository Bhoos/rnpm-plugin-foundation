/* eslint-disable function-paren-newline */

const androidCodeEditor = require('./editor/java');

module.exports = function mainApplication(content) {
  const editor = androidCodeEditor(content);

  editor
    .addMethod('onCreate', 'public', 'void', '', true)();

  const res = editor.getGenerator();
  res.getContent = () => editor.getContent();
  return res;
};
