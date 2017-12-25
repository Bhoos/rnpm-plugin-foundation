const filter = require('./_filter');
const flatten = require('../util/flatten');

module.exports = (name, platform) => {
  const platformFilter = filter(platform);
  return (project, pkg, dependencies) => {
    // Initialize the platform

    const config = platformFilter(pkg.foundation, 'app');
    const constants = platformFilter(pkg.foundation, 'constants');
    const subModules = platformFilter(pkg.foundation, 'sub-modules');

    const app = platform.init(project, {
      config,
      constants,
      subModules,
    }, dependencies);

    return {
      getName: () => name,

      getConstants: () => constants,

      getConfig: () => config,

      updateProject: () => {
        platform.updateProject();
      },

      hook: () => {
        dependencies.forEach((d) => {
          d.runHook(name, app);
        });
      },

      flush: () => platform.flush(app),
    };
  };
};
