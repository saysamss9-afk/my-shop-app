const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
      '@gluestack-ui/button': path.resolve(appDirectory, 'node_modules/@gluestack-ui/button/lib/index.jsx'),
      '@gluestack-ui/themed': path.resolve(appDirectory, 'node_modules/@gluestack-ui/themed/build/index.js'),
      '@gluestack-ui/config': path.resolve(appDirectory, 'node_modules/@gluestack-ui/config/build/gluestack-ui.config.js'),
      'react-native-sqlite-storage': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-print': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-vision-camera': path.resolve(appDirectory, 'src/web-mocks.js'),
      'react-native-vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@react-native-vector-icons/material-design-icons': path.resolve(appDirectory, 'src/web-mocks.js'),
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/web-mocks.js'),
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
