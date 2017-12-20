module.exports = function insertString(source, pos, snippet) {
  return source.substring(source, pos) + snippet + source.substr(pos);
};
