const parseSectionProp = require('./_parseSectionProp');

module.exports = parseSectionProp('    ', '}', (line, raw, section, parse) => {
  // Ignore empty lines
  if (line.length === 0 || line[0] === '/' || line[0] === '*') {
    section.addRaw(raw);
  } else if (line[0] === '}') {
    section.close(raw);
    return true;
  } else {
    const idx = line.indexOf('{');
    // We either got a section or a prop
    const indentation = raw.substring(0, raw.indexOf(line));
    if (idx >= 0) {
      // We got ourselves a new section
      const parts = line.substr(0, line.length - 1).split(/[\s{(]/, 2);
      const sectionName = parts[0];
      const remaining = line.substr(sectionName.length);
      const newSection = section.addSection(sectionName, remaining, indentation);
      // Recursively parse for the new section
      parse(newSection);
    } else {
      // Treat it like a prop
      const parts = line.split(/[\s(]+/, 2);
      const propName = parts[0];
      const propValue = line.substr(propName.length).trim();

      section.addProp(propName, propValue, indentation);
    }
  }
  return false;
});
