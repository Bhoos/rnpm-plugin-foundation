const platforms = require('./platforms');

module.exports = (platform) => {
  function recurse(value) {
    if (Array.isArray(value)) {
      return value.map(v => recurse(v));
    } else if (typeof value === 'object' && value !== null) {
      if (value[platform] !== undefined) {
        return recurse(value[platform]);
      }

      const res = {};
      Object.keys(value).forEach((key) => {
        // Skip any platform specific keys
        if (platforms.indexOf(key) >= 0) {
          return;
        }
        res[key] = recurse(value[key]);
      });

      if (Object.keys(res).length === 0) {
        return undefined;
      }
      return res;
    }

    return value;
  }

  // the filter method
  return (tree, branch) => {
    if (!tree) {
      return {};
    }

    const obj = tree[branch];
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }

    return recurse(obj);
  };
};
