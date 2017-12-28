const ios = require('./ios');
const android = require('./android');

const platforms = require('./platforms');
const platform = require('./_platform');

const processors = {
  ios,
  android,
};


module.exports = platforms.map(p => platform(p, processors[p]));

