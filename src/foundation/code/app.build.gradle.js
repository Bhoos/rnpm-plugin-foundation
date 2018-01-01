const gradleEditor = require('./editor/gradle');

module.exports = function appBuildGradle(file) {
  const editor = gradleEditor(file);

  editor.addPropSetter('config', (root, obj) => {
    const defaultConfig = root.section('android').section('defaultConfig');
    Object.keys(obj).forEach((name) => {
      // console.log(defaultConfig.prop(name).get());
      defaultConfig.prop(name).set(obj[name]);
    });
  });

  editor.addPropSetter('plugin', (root, name) => {
    if (!root.props('apply').find(p => p.get().indexof(name) >= 0)) {
      root.addProp('apply', `plugin: '${name}'`);
    }
  });

  editor.addPropSetter('dependency', (root, name, version) => {
    const dependencies = root.section('dependencies');

    // Check if the dependency has already been added
    const values = dependencies
      .props('compile')
      .map(v => v.get()).concat(dependencies
        .sections('compile')
        .map(s => s.extra));

    // Only add if there isn't already a compile for the given name
    if (values.filter(v => v.indexOf(name) >= 0).length === 0) {
      const value = version ? `:${version}` : '';
      dependencies.addProp('compile', `"${name}${value}"`);
    }
  });

  editor.addPropSetter('projectDependency', (root, name) => {
    const dependencies = root.section('dependencies');

    const values = dependencies
      .props('compile')
      .map(v => v.get()).concat(dependencies
        .sections('compile')
        .map(s => s.extra));
    if (values.filter(v => v.indexOf(name) >= 0).length === 0) {
      const value = `project(":${name}")`;
      dependencies.addProp('compile', value);
    }
  });

  return editor;
};
