const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const appDirectory = path.resolve(__dirname);

const babelLoaderConfiguration = {
  test: /\.(tsx|ts|js|jsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/react-native-paper'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(appDirectory, 'node_modules/react-native-safe-area-context'),
    path.resolve(appDirectory, 'node_modules/react-native-screens'),
    path.resolve(appDirectory, 'node_modules/react-native-reanimated'),
    path.resolve(appDirectory, 'node_modules/react-native-svg'),
    path.resolve(appDirectory, 'node_modules/react-native'),
    path.resolve(appDirectory, 'node_modules/@react-native-firebase'),
    path.resolve(appDirectory, 'node_modules/@gluestack-ui'),
    path.resolve(appDirectory, 'node_modules/@gluestack-style'),
    path.resolve(appDirectory, 'node_modules/@expo/html-elements'),
    path.resolve(appDirectory, 'node_modules/lucide-react-native'),
    path.resolve(appDirectory, 'node_modules/@react-native/assets-registry'),
    path.resolve(appDirectory, 'node_modules/@react-native-aria'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: false,
      presets: [
        'module:@react-native/babel-preset',
      ],
      plugins: ['react-native-web'],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

module.exports = {
  entry: [path.resolve(appDirectory, 'index.web.js')],
  cache: false,
  output: {
    filename: 'bundle.web.js',
    path: path.resolve(appDirectory, 'dist'),
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      global: 'window',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
    new webpack.ProvidePlugin({
      React: 'react',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'web/manifest.json', to: 'manifest.json' },
        { from: 'web/service-worker.js', to: 'service-worker.js' },
        { from: 'icon-user.png', to: 'icon-user.png' },
      ],
    }),
  ],
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-sqlite-storage': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-print': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-vision-camera': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@react-native-vector-icons/material-design-icons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.jsx', '.web.js', '.js', '.mjs'],
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.resolve(appDirectory, 'dist'),
    },
    port: 3000,
    hot: true,
  },
};
