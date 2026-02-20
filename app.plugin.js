const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Remove duplicate Firebase notification color metadata to avoid manifest merge conflict
 */
const withFixedAndroidManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Remove Firebase Messaging default notification color metadata
    // to avoid conflict with expo-notifications plugin
    if (application['meta-data']) {
      application['meta-data'] = application['meta-data'].filter(
        (meta) =>
          meta.$['android:name'] !== 'com.google.firebase.messaging.default_notification_color'
      );
    }

    return config;
  });
};

module.exports = withFixedAndroidManifest;
