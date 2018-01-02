const plistEditor = require('./editor/plist');

module.exports = function entitlements(file) {
  const editor = plistEditor(file);

  editor.addMethod('domain', (g, name) => {
    g.addUnique('com.apple.developer.associated-domains', name);
  });

  return editor;
};
