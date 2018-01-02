const parseSectionProp = require('./_parseSectionProp');

module.exports = parseSectionProp('  ', 'end', (line, raw, section, parse) => {
  if (line.length === 0 || line[0] === '*') {
    section.addRaw(raw);
  } else {
    // Get the indentation
    const indentation = raw.substring(0, raw.indexOf(line));

    // Break the line into number of words
    const words = line.split(/[\s(]/);
    const first = words[0];
    const remaining = line.substr(first.length);
    if (first === 'end') {
      section.close(raw);
      return true;
    }

    // If there is a do among the words, then its a new section
    if (
      words.indexOf('do') >= 0
      || first === 'if'
      || first === 'def'
      || first === 'for'
      || first === 'class'
      || first === 'begin'
    ) {
      // Start a new section
      const newSection = section.addSection(first, remaining, indentation);
      parse(newSection);
    } else {
      // Treat every assignment as a prop
      section.addProp(first, remaining.trim(), indentation);
    }
  }

  return false;
});
