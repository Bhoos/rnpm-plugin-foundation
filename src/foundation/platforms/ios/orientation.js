module.exports = function iosOrientation(orientation) {
  if (orientation === 'landscape') {
    return [
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ];
  } else if (orientation === 'portrait') {
    return [
      'UIInterfaceOrientationPortrait',
    ];
  }
  return [
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
    'UIInterfaceOrientationPortrait',
  ];
};
