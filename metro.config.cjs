const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@/lib": require("path").join(__dirname, "lib"),
  "@/features": require("path").join(__dirname, "features"),
  "@/components": require("path").join(__dirname, "src", "components"),
  "@/src": require("path").join(__dirname, "src"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
