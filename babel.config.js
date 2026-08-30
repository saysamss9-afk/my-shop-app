module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { useTransformReactJSX: true }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    'react-native-web',
    ['react-native-reanimated/plugin', { processNestedWorklets: true }]
  ],
};
