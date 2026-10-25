// Makes the Android app smaller. All of llama.rn's CPU builds and its OpenCL (GPU) build stay.
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const GRADLE_PROPERTIES = {
  // Only 64-bit ARM phones. llama.rn's CPU/GPU builds are all arm64; other ABIs only add size.
  reactNativeArchitectures: 'arm64-v8a',
  // Compress the native libraries in the APK (llama.rn's builds are ~11 MB each uncompressed).
  'expo.useLegacyPackaging': 'true',
  // Remove unused Java code and resources from release builds.
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

// llama.rn copies its Hexagon (NPU) libraries into the app's assets, but its from-source
// build has no Hexagon backend, so they are never used. ~4 MB.
const IGNORE_ASSETS = ":!ggml-hexagon'";

module.exports = function withSmallApk(config) {
  config = withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      config.modResults = config.modResults.filter((item) => item.type !== 'property' || item.key !== key);
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(IGNORE_ASSETS)) {
      config.modResults.contents = config.modResults.contents.replace(
        /(ignoreAssetsPattern '[^']*)'/,
        `$1${IGNORE_ASSETS}`
      );
    }
    return config;
  });
};
