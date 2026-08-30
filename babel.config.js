module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { useTransformReactJSX: true }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-class-static-block',
    'react-native-web',
    ['react-native-reanimated/plugin', { processNestedWorklets: true }]
  ],
};
