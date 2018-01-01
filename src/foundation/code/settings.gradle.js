const gradleEditor = require('./editor/gradle');

module.exports = function settingsGradle(file) {
  const editor = gradleEditor(file);

  editor.addPropSetter('include', (root, name) => {
    // Make sure the project is not alredy there
    const txt = `':${name}'`;

    // Only add if not already there
    if (!root.props('include').find(p => p.get().indexOf(txt) >= 0)) {
      root.addProp('include', txt);
      root.addProp('project', `(${txt}).projectDir = new File(rootProject.projectDir, '../node_modules/${name}/android')`);
    }
  });

  return editor;
};
