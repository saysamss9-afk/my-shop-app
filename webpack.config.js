const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
require('dotenv').config();

const appDirectory = path.resolve(__dirname);

const babelLoaderConfiguration = {
  test: /\.(tsx|ts|js|jsx|mjs)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    (inputPath) => {
      const normalizedPath = inputPath.replace(/\\/g, '/');
      return normalizedPath.includes('node_modules/@gluestack-ui') ||
             normalizedPath.includes('node_modules/@gluestack-style') ||
             normalizedPath.includes('node_modules/@react-native-aria') ||
             normalizedPath.includes('node_modules/@legendapp') ||
             normalizedPath.includes('node_modules/react-native') ||
             normalizedPath.includes('node_modules/@react-native') ||
             normalizedPath.includes('node_modules/@react-native-firebase') ||
             normalizedPath.includes('node_modules/lucide-react-native') ||
             normalizedPath.includes('node_modules/react-native-svg') ||
             normalizedPath.includes('node_modules/react-native-reanimated') ||
             normalizedPath.includes('node_modules/react-native-paper') ||
             normalizedPath.includes('node_modules/react-native-vector-icons') ||
             normalizedPath.includes('node_modules/react-native-safe-area-context') ||
             normalizedPath.includes('node_modules/react-native-screens') ||
             normalizedPath.includes('node_modules/@expo/html-elements') ||
             normalizedPath.includes('node_modules/@react-native/assets-registry');
    }
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      babelrc: false,
      configFile: false,
      presets: [
        ['module:@react-native/babel-preset', { useTransformReactJSX: true }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
        '@babel/preset-flow',
      ],
      plugins: [
        'react-native-web',
        '@babel/plugin-transform-class-static-block',
        ['react-native-reanimated/plugin', { processNestedWorklets: true }],
      ],
    },
  },
};

const mjsLoaderConfiguration = {
  test: /\.mjs$/,
  include: /node_modules/,
  type: 'javascript/auto',
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
      mjsLoaderConfiguration,
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
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
      global: 'window',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
    new webpack.ProvidePlugin({
      React: 'react',
      process: 'process/browser.js',
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
      'lucide-react-native$': 'lucide-react',
      'react-native-sqlite-storage': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-print': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-vision-camera': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@react-native-community/netinfo': path.resolve(appDirectory, 'src/netinfo-web-mock.ts'),
      'react-native-vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@react-native-vector-icons/material-design-icons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@react-native-firebase/app': path.resolve(appDirectory, 'src/firebase-config.ts'),
      '@react-native-firebase/auth': path.resolve(appDirectory, 'src/auth-web-mock.ts'),
      '@react-native-firebase/firestore': path.resolve(appDirectory, 'src/firestore-web-mock.ts'),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.jsx', '.web.js', '.js', '.mjs', '.json'],
    modules: [path.resolve(appDirectory, 'node_modules'), 'node_modules'],
    mainFields: ['browser', 'module', 'main'],
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.resolve(appDirectory, 'dist'),
    },
    port: 3000,
    hot: false,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
};
