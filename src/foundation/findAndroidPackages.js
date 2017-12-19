const fs = require('fs');
const path = require('path');

/**
 * Search within the node_modules folder for the specific library
 * for android files and pick out the name of the class that
 * extends ReactPackage.
 *
 * @param {*} The name of the library
 *            (Ex: react-native-fbsdk, react-native-device-info, etc);
 */

module.exports = function findAndroidPackages(libName) {
  // The android folder where the all the android packages are supposed
  // to be stored
  const androidPath = path.resolve('.', 'node_modules', libName, 'android');

  // Search for the React Package from the mainfest file
  const manifestPath = path.resolve(androidPath, 'app/src/main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  const manifest = fs.readFileSync(manifestPath);
  const match = /<manifest\s+[\s\S]*package\s*=\s*"([\w.]*)"/.exec(manifest);
  if (match !== null) {
    const packagePath = match[1].split('.').join('/');
    // Search for java files within the path for the packages class
    const folder = path.resolve(androidPath, 'app/src/main/java', packagePath);
    const files = fs.readdirSync(folder);
    return files.filter((f) => {
      const javaFile = path.resolve(folder, f);
      try {
        const javaSource = fs.readFileSync(javaFile).toString();
        return /.*class\s+(\w*)\s+extends\s+ReactPackage/.test(javaSource);
      } catch (e) {
        return false;
      }
    }).map((f) => {
      const name = f.substr(0, f.length - 5);
      return {
        name,
        packageName: match[1],
        fullName: `${match[1]}.${name}`,
        fullPath: `${folder}/${f}`,
      };
    });
  }

  return [];
};
