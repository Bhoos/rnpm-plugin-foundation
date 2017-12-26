const genericEditor = require('./editor/generic');

module.exports = function appBuildGradle(file) {
  const editor = genericEditor(file);

  editor.addReplacer('applicationId', /^\s+applicationId\s+(.*)\s*$/gm);
  editor.addReplacer('versionCode', /^\s+versionCode\s+(.*)\s*$/gm);
  editor.addReplacer('versionName', /^\s+versionName\s+(.*)\s*$/gm);

  return editor;
};
