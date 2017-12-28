const xmlEditor = require('./editor/xml');

module.exports = function androidManifest(file) {
  return xmlEditor(file).then((editor) => {
    editor.addMethod('orientation', (root, orientation) => {
      root.node('application').set('android:screenOrientation', orientation);
    });

    editor.addMethod('metaData', (root, name, value) => {
      root.node('application').create('meta-data', {
        'android:name': name,
        'android:value': value,
      });
    });

    editor.addMethod('link', (root, host, pathPrefix) => {
      const intentFilter = root.node('application').node('activity').create('intent-filter');
      intentFilter.create('action', { 'android:name': 'android.intent.action.VIEW' });
      intentFilter.create('category', { 'android:name': 'android.intent.category.DEFAULT' });
      intentFilter.create('category', { 'android:name': 'android.intent.category.BROWSABLE' });
      intentFilter.create('data', {
        'android:scheme': 'https',
        'android:host': host,
        'android:pathPrefix': pathPrefix,
      });
    });

    return editor;
  });
};
