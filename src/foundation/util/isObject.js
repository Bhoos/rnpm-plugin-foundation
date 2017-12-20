module.exports = function isObject(v) {
  return (typeof v === 'object' && v !== null && !Array.isArray(v));
};
