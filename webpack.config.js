const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

const babelLoaderConfiguration = {
  test: /\.(tsx|ts|js)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/react-native-paper'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(appDirectory, 'node_modules/react-native-safe-area-context'),
    path.resolve(appDirectory, 'node_modules/react-native-screens'),
    path.resolve(appDirectory, 'node_modules/react-native'),
    path.resolve(appDirectory, 'node_modules/@react-native-firebase/app'),
    path.resolve(appDirectory, 'node_modules/@react-native-firebase/auth'),
    path.resolve(appDirectory, 'node_modules/@react-native-firebase/firestore'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['module:@react-native/babel-preset'],
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
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
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
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
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
