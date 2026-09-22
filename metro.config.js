const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
