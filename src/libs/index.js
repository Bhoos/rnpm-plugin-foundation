const rn = require('./react-native/hook');
const fbsdk = require('./react-native-fbsdk/hook');
const firebase = require('./react-native-firebase/hook');

module.exports = {
  'react-native': rn,
  'react-native-fbsdk': fbsdk,
  'react-native-firebase': firebase,
};
