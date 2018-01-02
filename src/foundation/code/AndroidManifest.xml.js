const xmlEditor = require('./editor/xml');

module.exports = function androidManifest(file) {
  return xmlEditor(file).then((editor) => {
    editor.addMethod('orientation', (root, orientation) => {
      root.node('application').set('android:screenOrientation', orientation);
    });

    editor.addMethod('metaData', (root, name, value) => {
      // Add only if not already added
      root.node('application').nodeByName('meta-data', name).update({
        'android:value': value,
      });
    });

    editor.addMethod('link', (root, scheme, host, pathPrefix, autoVerify) => {
      const activity = root.node('application').node('activity');

      const idx = activity.nodes('intent-filter').findIndex(n => (
        n.get('android:scheme') === scheme ||
        n.get('android:host') === host ||
        n.get('android:pathPrefix') === pathPrefix
      ));

      if (idx === -1) {
        const f = activity.create('intent-filter', autoVerify ? { 'android:autoVerify': 'true' } : {});
        f.create('action', { 'android:name': 'android.intent.action.VIEW' });
        f.create('category', { 'android:name': 'android.intent.category.DEFAULT' });
        f.create('category', { 'android:name': 'android.intent.category.BROWSABLE' });
        f.create('data', {
          'android:scheme': scheme,
          'android:host': host,
          'android:pathPrefix': pathPrefix,
        });
      }
    });

    return editor;
  });
};
