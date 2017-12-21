const filter = require('./_filter');
const flatten = require('../util/flatten');

module.exports = (name, platform) => {
  const platformFilter = filter(platform);
  return (project, pkg, dependencies) => {
    // Get platform specific values from the pkg
    const app = platformFilter(pkg.foundation, 'app');
    const constants = flatten(platformFilter(pkg.foundation, 'constants'));
    const subModules = platformFilter(pkg.foundation, 'sub-modules');

    app.getConstants = () => constants;
    app.getSubModules = () => subModules;

    return {
      getName: () => name,

      updateProject: () => {
        platform.updateProject(project, app, dependencies);
      },

      hook: () => {
        dependencies.forEach((d) => {
          platform.hook(project, app, d);
        });
      },
    };
  };
};
