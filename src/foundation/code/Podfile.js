const podfileEditor = require('./editor/podfile');

module.exports = function podfile(file) {
  const editor = podfileEditor(file);

  editor.addPropSetter('pod', (root, name, version, options = {}) => {
    const target = root.section('target');
    if (!target.props('pod').find(p => p.get().indexOf(name) >= 0)) {
      const args = [`'${name}'`];
      if (version) {
        args.push(`'${version}'`);
      }
      Object.keys(options).forEach((k) => {
        args.push(`:${k} => '${options[k]}'`);
      });

      // include the pod after the last pod,
      // or after a blank line or before a section starts
      let position = -1;
      target.all.forEach((child, index) => {
        if (position === -1 && typeof child === 'string') {
          if (child.trim().length === 0) {
            position = index + 1;
          }
        } else if (position === -1 && child.type === 'section') {
          position = index + 1;
        } else if (child.type === 'prop' && child.name === 'pod') {
          position = index + 1;
        }
      });
      if (position === -1) {
        position = target.all.length;
      }
      target.insertProp('pod', args.join(', '), position);
    }
  });

  return editor;
};
