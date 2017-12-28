const genericEditor = require('./editor/generic');

module.exports = function androidManifest(file) {
  const editor = genericEditor(file);

  editor.addReplacer('android:screenOrientation', /^\s+applicationId\s+(.*)\s*$/gm);

  return editor;
};
