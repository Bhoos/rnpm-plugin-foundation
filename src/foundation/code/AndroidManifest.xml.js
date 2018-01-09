const path = require('path');
const xmlEditor = require('./editor/xml');

module.exports = function androidManifest(file) {
  const styleFile = path.resolve(path.dirname(file), 'res', 'values', 'styles.xml');

  return xmlEditor(file).then(editor => xmlEditor(styleFile).then((styleEditor) => {
    styleEditor.addMethod('fullScreen', (root, fullScreen) => {
      if (fullScreen) {
        const style = root.node('style');
        style.nodeBy('item', 'name', 'android:windowNoTitle').setValue('true');
        style.nodeBy('item', 'name', 'windowActionBar').setValue('false');
        style.nodeBy('item', 'name', 'android:windowFullscreen').setValue('true');
        style.nodeBy('item', 'name', 'android:windowContentOverlay').setValue('@null');
      }
    });

    editor.addMethod('orientation', (root, orientation) => {
      root.node('application').node('activity').set('android:screenOrientation', orientation);
    });

    editor.addMethod('fullScreen', (root, fullScreen) => {
      styleEditor.getGenerator().fullScreen(fullScreen);
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

    return {
      ...editor,
      flush: () => {
        editor.flush();
        styleEditor.flush();
      },
    };
  }));
};
