const filter = require('./_filter');
const flatten = require('../util/flatten');

module.exports = (name, platform) => {
  const platformFilter = filter(platform);
  return (project, pkg, dependencies) => {
    // Initialize the platform
    const app = platform.init(project, {
      config: platformFilter(pkg.foundation, 'app'),
      constants: platformFilter(pkg.foundation, 'constants'),
      subModules: platformFilter(pkg.foundation, 'sub-modules'),
    }, dependencies);

    return {
      getName: () => name,

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
