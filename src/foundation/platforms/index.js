const ios = require('./ios');
const android = require('./android');

const platform = require('./_platform');

module.exports = [
  platform('ios', ios),
  platform('android', android),
];
