module.exports = function flatten(object, separator) {
  const res = {};
  function recurse(value, prefix) {
    if (typeof value === 'object' && value !== null) {
      const p = prefix && `${prefix}${separator}`;
      Object.keys(value).forEach((key) => {
        const k = `${p}${key}`;
        res[k] = recurse(value[key], `${k}`);
      });
    } else {
      res[prefix] = value;
    }
  }

  recurse(object, '');
  return res;
};
