const filter = require('./_filter');

module.exports = (name, platform) => {
  const platformFilter = filter(platform);
  return (project, pkg, dependencies) => {
    // Initialize the platform

    const config = platformFilter(pkg.foundation, 'app');
    if (!config.name) {
      config.name = pkg.name;
    }
    if (!config.version) {
      config.version = pkg.version;
    }
    if (!config.bundleId) {
      config.bundleId = `com.reactjs.foundation.${config.name}`;
    }
    if (!config.buildNumber) {
      config.buildNumber = 1;
    }

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
