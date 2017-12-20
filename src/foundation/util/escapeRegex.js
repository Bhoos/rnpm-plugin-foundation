module.exports = text => (
  text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
);
