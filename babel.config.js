module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      '@babel/plugin-transform-export-namespace-from',
      ['react-native-reanimated/plugin', { processNestedWorklets: true }],
      'transform-inline-environment-variables'
    ],
  };
};
