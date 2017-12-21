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
        res[key] = recurse(value[key]);
      });
      return res;
    }

    return value;
  }

  // the filter method
  return (tree, branch) => {
    const obj = tree[branch];
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }

    return recurse(obj);
  };
};
