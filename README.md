# rnpm-plugin-foundation
A react-native dependency management plugin

# Objective
1. Make it simple to start a react-native project with native dependencies
   like fbsdk, firebase, etc. removing any (if possible) android/ios 
   specific changes

2. Make it easier to upgrade from one react-native version to another

3. Keep common data source. (Version, BuildNumber, etc)

# Installation
`$ npm install --save-dev rnpm-plugin-foundation`

# Usage
Install all the libraries that are needed for your project for example
`react-native-fbsdk`, `react-native-device-info`, `react-native-firebase`, etc.

After installing the library just run:
> `$ react-native foundation`

*NOTE: You need to run the plugin after installing any library with native 
depdenencies. To be on the safe side you can run the plugin before building*

You will need to then add a property on your package.json file that are used
to declare library specific variables like:
```json
{
  "name": "AppName",
  "version": "0.0.1",
  
  "foundation": {
    "app": {
      "bundleId": "com.example.myapp",
      "buildNumber": "1"
    },
    "constants": {
      "fb": {
        "app": {
          "id": "<your fb app id>",
          "name": "<your fb app name>"
        }
      }
    },
    "sub-modules": {
      "react-native": ["Linking", "PushNotificationIOS"],
      "react-native-firebase": ["Admob"]
    }
  }
}
```

You could define platform specific values if needed
```json
{
  "foundation": {
    "app": {
      "bundleId": {
        "android": "com.example.android.myapp",
        "ios": "com.example.ios.myapp"
      },
    }
  }
}
```

## Android
To run the android project you can then follow your standard procedure

## iOS
To run the iOS project you will need to use `CocoaPods`. To initialize
CocoaPods. Move inside the the `ios` folder within your project and run:
> `$ pod init`  
> `$ pod install`

The `pod init` command needs to run just once whereas run `pod install`
every time you need to build the project. (For now)

# Notes
Running the foundation plugin will change your native source code

## Common
1. `foundation.lock`  
   A lock file that stores all the information required for building
   the android/ios project. You need to commit this file as well. Do
   not ever directly edit this file. The plugin updates this file as
   and when required.

## Android
1. `android/settings.gradle`  
   Adds a dynamic script to automatically link the libraries provided
   via the `foundation.lock` file
2. `android/build.gradle`  
   Adds a script to change the sdkVersion and buildToolsVersion for all
   the subprojects (libraries) to be same as the main project. Without
   this it is highly likely to fail android project specially when using
   libraries like 'react-native-fbsdk'
3. `android/app/build.gradle`  
   Adds a script to automatically compile the dependencies based on the
   `foundation.lock` file. Also script to replace all plugin specific
   variables `{{fb.app.id}}` in the manifest file.
4. `android/app/src/main/java/.../MainActivity.java`  
   This file is automatically updated to add any code required by the
   library.
5. `android/app/src/main/java/.../MainApplication.java`  
   This file is automatically updated to add any code required by the
   library.

## iOS
1. `project.pbxproj`  
   Uses `RNFoundation-Info.plist` file as the main plist file instead
   of `Info.plist` file. This is done to merge information provided by
   the libraries into a single plist file with replaceable constants like
   {{fb.app.id}}, which is done by `pod install` at the moment.
2. `<Your Project>/AppDelegate.m`  
   This file is automatically updated to add any code required by the
   library.
3. `Podfile`  
   Once CocoaPods is initialized. You then work on xcode workspace rather
   than xcode project. You will also get a `Pods` folder created once the
   CocoaPods is initialized. You can ignore this folder on your source control
   as it keeps all the library releases within this folder.
4. Within ios folder a new file will be added named `RNFoundation-Info.plist`
   which is updated every time `pod install` is run. Its upto you if you
   want to include it in your source control or not.

# For the library Developers
The library developers can add hook within their project to make changes to
the source code, so that the library works without making any changes to the
native codes for the user. Its not required to add a hook for the basic type
of project. But if there are non-standard changes, you can add hooks declared
via your package.json.

Your hooks look like:
```javascript
module.exports = {
  android: ({ code, subModules, config, constants }, dependency) => {
    code.mainApplication.import('com.facebook.CallbackManager');
    code.mainApplication.import('com.facebook.FacebookSdk');
    code.mainApplication.import('com.facebook.reactnative.androidsdk.FBSDKPackage');
    code.mainApplication.import('android.content.Intent');

    code.mainApplication.addProperty(
      'protected static',
      'CallbackManager',
      'callbackManager',
      'CallbackManager.Factory.create()'
    );

    code.mainApplication.addReactPackage('FBSDKPackage(callbackManager)');
    // // Looks like sdkInitialize has been deprecated, no call needed
    // code.mainApplication.onCreate('FacebookSdk', () => (
    //   'sdkInitialize(getApplicationContext())'
    // ));

    code.mainActivity.onActivityResult('MainApplication.callbackManager');
  },

  ios: ({ code, subModules, config, constants }, dependency) => {
    code.appDelegate.import('<FBSDKCoreKit/FBSDKCoreKit.h>');
    code.appDelegate.didFinishLaunchingWithOptions('[FBSDKApplicationDelegate sharedInstance');
    code.appDelegate.openURL('[FBSDKApplicationDelegate sharedInstance]', (app, url, options) => `
      application:${app}
      openURL:${url}
      sourceApplication:${options}[UIApplicationOpenURLOptionsSourceApplicationKey]
      annotation:${options}[UIApplicationOpenURLOptionsAnnotationKey]
    `);
  },
};
```

The hook file then needs to be provided via `package.json` 
```json
{
  "foundation": {
    "hook": "<your hook definition file>",
    "plist": "ios info.plist declaration to be merged",
    "manifest": "AndroidManifest.xml file to be merged"
  }
}
```

# Additional Features
1. Bundle signature `config.signBundle`  
   Provide a salt in the configuration to sign your javascript bundle to avoid 
   tampering of javascript bundle directly in the apk. Works in android only.
```json
  { 
    "foundation": {
      "config": {
        ...
        "signBundle": "<Salt for generating signature>"
      }
    }
  }
```
