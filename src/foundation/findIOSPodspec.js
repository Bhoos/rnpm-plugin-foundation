const path = require('path');
const fs = require('fs');
const xcode = require('xcode');

function scan(folder) {
  try {
    const files = fs.readdirSync(folder);
    return files
      .filter(f => f.endsWith('.podspec'))
      .map(f => ({
        name: f.substr(0, f.length - 8),
        path: `${folder}/${f}`,
      }));
  } catch (e) {
    return [];
  }
}

function scanXCode(folder) {
  try {
    const files = fs.readdirSync(folder);
    return files
      .filter(f => f.endsWith('.xcodeproj'))
      .map((f) => {
        // Search for the pbxproj within the xcodeproj folder
        try {
          const prjFiles = fs.readdirSync(path.resolve(folder, f));
          for (let i = 0; i < prjFiles.length; i += 1) {
            if (prjFiles[i].endsWith('.pbxproj')) {
              return {
                pbxproj: path.resolve(folder, f, prjFiles[i]),
                path: folder,
              };
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      }).filter(f => f !== null);
  } catch (e) {
    return [];
  }
}

/**
 * Search for pod specifications for the given package name. If one or more
 * pod specification is found, return an array of information for those pods.
 * If pods are not found, then return array of information with source files
 * that could used to create a pod file.
 *
 * @param {*} pkgName The name of the library (Ex: react-native-fbsdk, etc)
 */
module.exports = function findIOSPodspec(pkgName) {
  // Search within the folder and the ios folder for a podspec file
  const pkgFolder = path.resolve('node_modules', pkgName);
  const iosFolder = path.resolve(pkgFolder, 'ios');

  const files = scan(pkgFolder).concat(scan(iosFolder));

  if (files.length !== 0) {
    return files;
  }

  // See if there are podspec defined within the libs folder for this particular library
  const libsFolder = path.resolve(__dirname, '../libs', pkgName);
  const libFiles = scan(libsFolder);
  if (libFiles.length !== 0) {
    return libFiles;
  }

  // Looks like there aren't any podspec defined for this lib, check if
  // there is a xcodeproj within this package and use it to find the source
  // files
  const projects = scanXCode(pkgFolder).concat(scan(iosFolder));
  // Create a list of source files from the project file
  return projects.reduce((res, prj) => {
    const pbxProj = xcode.project(prj.pbxproj);

    pbxProj.parseSync();

    // find all the files (*.m and *.h) referenced by the project
    // and include them
    const ref = pbxProj.pbxFileReferenceSection();
    const sourceFiles = Object.keys(ref).filter((key) => {
      const r = ref[key];
      if (!(r.isa === 'PBXFileReference')) {
        return false;
      }

      const type = r.lastKnownFileType;
      return type === 'sourcecode.c.h' || type === 'sourcecode.c.objc';
    }).map(k => ref[k].path);

    return res.concat({
      path: prj.path,
      files: sourceFiles,
    });
  }, []);
};
