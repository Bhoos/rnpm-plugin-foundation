const gradleEditor = require('./editor/gradle');

module.exports = function projectBuildGradle(file) {
  const editor = gradleEditor(file);

  editor.addPropSetter('classpath', (root, name, version) => {
    const dependencies = root.section('buildscript').section('dependencies');

    const n = `${name}:`;
    // no need to add a classpath if it already exists
    if (!dependencies.props('classpath').find(p => p.get().indexOf(n) >= 0)) {
      dependencies.addProp('classpath', `'${n}${version}`);
    }
  });

  editor.addPropSetter('mavenRepo', (root, url) => {
    // only add if not already there
    const repo = root.section('allprojects').section('repositories');
    if (!repo.sections('maven').find(m => m.prop('url').get().indexOf(url) >= 0)) {
      const s = repo.addSection('maven');
      s.addProp('url', `"${url}"`);
    }
  });

  return editor;
};
