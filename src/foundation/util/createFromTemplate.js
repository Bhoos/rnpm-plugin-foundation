const fs = require('fs');
const path = require('path');

module.exports = function createFromTemplate(file, dict, target) {
  const data = fs.readFileSync(path.resolve(__dirname, 'templates', file)).toString('utf-8');
  const fileData = data.replace(/{{(\w*)}}/g, (match, key) => (
    dict[key]
  ));

  if (target) {
    fs.writeFileSync(target, fileData, 'utf-8');
  }

  return target;
};
