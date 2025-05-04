const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { mergeConfig } = require('metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const baseConfig = getDefaultConfig(__dirname);
const nativeWindConfig = withNativeWind(baseConfig, { input: './global.css' });

module.exports = wrapWithReanimatedMetroConfig(nativeWindConfig);
