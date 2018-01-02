const fs = require('fs');

const platforms = require('./platforms');

const getDependencies = require('./getDependencies');

module.exports = function foundation(args, config) {
  const project = config.getProjectConfig();

  // Read data from the main application package.json
  // The keys used from the package are
  //  1. name: To use as name for the application wherever applicable
  //  2. version: To use as main app version
  //  3. dependencies: To link all the necessary libraries
  //  4: foundation: The plugin specific configuration, can override
  //                 name, version, provide other meta data, subModules,
  //                 constants (that can be platform specific)
  const pkg = JSON.parse(fs.readFileSync('./package.json'));

  // Get all the dependencies for this package that needs to be processed
  const dependencies = getDependencies(pkg);

  // Initialize each platform for further processing
  return Promise.all(platforms.map(platform => platform(project, pkg, dependencies)))
    .then((platFormProcessors) => {
      // Execute all the stages for all the platforms;
      const stages = ['updateProject', 'hook', 'flush'];
      stages.forEach((stage) => {
        platFormProcessors.forEach((p) => {
          p[stage]();
        });
      });
    });
};
