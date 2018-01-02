const fs = require('fs');

module.exports = function createHandlerFactory(spacing, ending, lineParser) {
  return function createHandler(file) {
    const content = fs.readFileSync(file).toString('utf-8');
    const lines = content.split('\n');
    let lineNum = 0;

    function createProp(name, value, indentation) {
      let v = value;
      return {
        name,
        type: 'prop',
        toString: () => {
          const f = v.startsWith('(') ? v : ` ${v}`;
          return `${indentation}${name}${f}`;
        },
        getDefault: () => value,
        get: () => v,
        set: (newValue) => { v = newValue; },
      };
    }

    function createSection(id, extra, indentation) {
      const children = [];
      const sections = {};
      const props = {};

      const isRoot = id === '' && indentation === '';

      const childIndentation = isRoot ? '' : `${indentation}${spacing}`;
      const opening = isRoot ? '' : `${indentation}${id}${extra}\n`;
      let closing = isRoot ? '' : `\n${indentation}${ending}`;

      return {
        name: id,
        type: 'section',
        extra,
        toString: () => `${opening}${children.map(c => c.toString()).join('\n')}${closing}`,
        close: (text) => {
          closing = `\n${text}`;
        },
        all: children,
        prop: (name, index = 0) => {
          if (props[name]) {
            const namedProps = children.filter(ch => (
              typeof ch !== 'string' && ch.type === 'prop' && ch.name === name
            ));
            if (index > namedProps.length) {
              throw new Error(`Index out of range while accessing ${name} prop in ${file}`);
            }
            return namedProps[index];
          }
          props[name] = true;
          const newProp = createProp(name, null, childIndentation);
          children.push(newProp);
          return newProp;
        },
        props: (name) => {
          if (!props[name]) {
            return [];
          }
          return children.filter(ch => (
            typeof ch !== 'string' && ch.type === 'prop' && ch.name === name
          ));
        },
        insertProp: (name, value, position) => {
          if (!props[name]) {
            props[name] = true;
          }
          const newProp = createProp(name, value, childIndentation);
          children.splice(position, 0, newProp);
          return newProp;
        },
        addProp: (name, value, indent = childIndentation) => {
          if (!props[name]) {
            props[name] = true;
          }
          const newProp = createProp(name, value, indent);
          children.push(newProp);
          return newProp;
        },
        section: (name, index = 0) => {
          if (sections[name]) {
            const namedSections = children.filter(ch => (
              typeof ch !== 'string' && ch.type === 'section' && ch.name === name
            ));
            if (index > namedSections.length) {
              throw new Error(`Index out of range while accessing ${name} section in ${file}`);
            }
            return namedSections[index];
          }
          const newSection = createSection(name, '', childIndentation);
          sections[name] = true;
          children.push(newSection);
          return newSection;
        },
        allSections: () => children.filter(ch => typeof ch !== 'string' && ch.type === 'section'),

        sections: (name) => {
          if (!sections[name]) {
            return [];
          }
          return children.filter(ch => (
            typeof ch !== 'string' && ch.type === 'section' && ch.name === name
          ));
        },
        addSection: (name, extraPart = ' {', indent = childIndentation) => {
          const section = createSection(name, extraPart, indent);
          if (!sections[name]) {
            sections[name] = true;
          }
          children.push(section);
          return section;
        },
        addRaw: raw => children.push(raw),
      };
    }

    function parse(section) {
      while (lineNum < lines.length) {
        const raw = lines[lineNum];
        lineNum += 1;

        const line = raw.trim();

        if (lineParser(line, raw, section, parse)) {
          break;
        }
      }
    }

    // Treat generator as the root section
    const generator = createSection('', '', '');
    parse(generator);
    return {
      addPropSetter: (name, cb) => {
        generator[name] = (...args) => {
          cb(generator, ...args);
        };
      },
      getGenerator: () => generator,
      getContent() { return generator.toString(); },
      flush() { fs.writeFileSync(file, this.getContent()); },
    };
  };
};
