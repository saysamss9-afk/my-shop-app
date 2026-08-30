const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: [...getDefaultConfig(__dirname).resolver.sourceExts, 'cjs'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
