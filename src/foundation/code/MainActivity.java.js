/* eslint-disable function-paren-newline */

const androidCodeEditor = require('./editor/java');

module.exports = function mainActivity(content) {
  const editor = androidCodeEditor(content);

  editor
    .addMethod('onActivityResult', 'public', 'void', '', true)(
      'requestCode', 'int')(
      'resultCode', 'int')(
      'data', 'Intent')();

  const res = editor.getGenerator();
  res.getContent = () => editor.getContent();
  return res;
};
