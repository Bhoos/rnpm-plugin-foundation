/* eslint-disable function-paren-newline */

const iosCodeEditor = require('./editor/objectiveC');

module.exports = function appDelegate(file) {
  const editor = iosCodeEditor(file);

  // Use for library initializations
  editor
    .addMethod('didFinishLaunchingWithOptions', 'BOOL', 'YES')(
      'application', 'UIApplication *')(
      'didFinishLaunchingWithOptions', 'NSDictionary *', 'launchOptions')();


  // Use for linking URLs
  editor
    .addMethod('openURL', 'BOOL', null)(
      'application', 'UIApplication *')(
      'openURL', 'NSURL *', 'url')(
      'options', 'NSDictionary<UIApplicationOpenURLOptionsKey,id> *')();

  // openURL targetted for iOS 8 or older
  editor
    .addMethod('openURL8', 'BOOL', null)(
      'application', 'UIApplication *')(
      'openURL', 'NSURL *', 'url')(
      'sourceApplication', 'NSString *')(
      'annotation', 'id')();

  // Used for Universal links
  editor
    .addMethod('continueUserActivity', 'BOOL', null)(
      'application', 'UIApplication *')(
      'continueUserActivity', 'NSUserActivity *')(
      'restorationHandler', 'void (^)(NSArray * _Nullable)')();

  // Push Notification - required to register for notifications
  editor
    .addMethod('didRegisterUserNotificationSettings', 'void', '')(
      'application', 'UIApplication *')(
      'didRegisterUserNotificationSettings', 'UIUserNotificationSettings *', 'notificationSettings')();

  // Push Notification - required for the register event
  editor
    .addMethod('didRegisterForRemoteNotificationsWithDeviceToken', 'void', '')(
      'application', 'UIApplication *')(
      'didRegisterForRemoteNotificationsWithDeviceToken', 'NSData *', 'deviceToken')();

  // Push Notification - required for the notification event.
  // You must call the completion handle after handlig the event
  editor
    .addMethod('didReceiveRemoteNotification', 'void', '')(
      'application', 'UIApplication *')(
      'didReceiveRemoteNotification', 'NSDictionary *', 'userInfo')(
      'fetchCompletionHandler', 'void (^)(UIBackgroundFetchResult)', 'completionHandler')();

  // Push Notification - required for registrationError event
  editor
    .addMethod('didFailToRegisterForRemoteNotificationsWithError', 'void', '')(
      'application', 'UIApplication *')(
      'didFailToRegisterForRemoteNotificationsWithError', 'NSError *', 'error')();

  // Required for the localNotification event.
  editor
    .addMethod('didReceiveLocalNotification', 'void', '')(
      'applicaiton', 'UIApplication *')(
      'didReceiveLocalNotification', 'UILocalNotification *', 'notification')();

  return editor;
};
