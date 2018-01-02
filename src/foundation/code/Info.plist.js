const plistEditor = require('./editor/plist');

function parseOrientation(o) {
  if (o === 'landscape') {
    return ['UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'];
  } else if (o === 'portrait') {
    return ['UIInterfaceOrientationPortrait'];
  }

  return [
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
    'UIInterfaceOrientationPortrait',
  ];
}

module.exports = function infoPlist(file) {
  const editor = plistEditor(file);

  editor.addMethod('orientation', (g, orientation) => {
    g.set({
      UISupportedInterfaceOrientations: parseOrientation(orientation),
    });
  });

  editor.addMethod('fullScreen', (g, fullScreen) => {
    g.set({
      UIStatusBarHidden: fullScreen,
      UIRequiresFullScreen: fullScreen,
    });
  });

  editor.addMethod('link', (g, name, scheme) => {
    const schemes = [scheme === undefined ? name : scheme];
    const n = g.find('CFBundleURLTypes', b => b.CFBundleURLName === name);
    if (n) {
      n.CFBundleURLSchemes = schemes;
    } else {
      g.add('CFBundleURLTypes', {
        CFBundleURLName: name,
        CFBundleURLSchemes: schemes,
      });
    }
  });

  editor.addMethod('queriesSchemes', (g, schemes) => {
    schemes.forEach((scheme) => {
      g.addUnique('LSApplicationQueriesSchemes', scheme);
    });
  });

  return editor;
};
