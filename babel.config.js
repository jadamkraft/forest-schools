module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@/lib": "./lib",
            "@/features": "./features",
            "@/components": "./src/components",
            "@/src": "./src",
          },
        },
      ],
    ],
  };
};
