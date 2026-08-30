module.exports = {
  dependencies: {
    'react-native-sqlite-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-sqlite-storage/platforms/android',
        },
        ios: null,
      },
    },
    // Add other native dependencies here to disable iOS autolinking
    'react-native-gesture-handler': { platforms: { ios: null } },
    'react-native-reanimated': { platforms: { ios: null } },
    'react-native-screens': { platforms: { ios: null } },
    'react-native-safe-area-context': { platforms: { ios: null } },
    'react-native-vector-icons': { platforms: { ios: null } },
    'react-native-vision-camera': { platforms: { ios: null } },
    'react-native-share': { platforms: { ios: null } },
    'react-native-sound': { platforms: { ios: null } },
    '@react-native-firebase/app': { platforms: { ios: null } },
    '@react-native-firebase/auth': { platforms: { ios: null } },
    '@react-native-firebase/firestore': { platforms: { ios: null } },
  },
};
