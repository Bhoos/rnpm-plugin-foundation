/* eslint-disable function-paren-newline */

const androidCodeEditor = require('./editor/java');

module.exports = function mainActivity(file) {
  const editor = androidCodeEditor(file);

  editor
    .addMethod('onActivityResult', 'public', 'void', '', true)(
      'requestCode', 'int')(
      'resultCode', 'int')(
      'data', 'Intent')();

  return editor;
};
