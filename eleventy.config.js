const postcss = require("./config/postcss");
const prettier = require("./config/prettier");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(prettier);
  eleventyConfig.addPlugin(postcss);
  eleventyConfig.addWatchTarget("./postcss.config.js");
  eleventyConfig.addWatchTarget("./tailwind.config.js");

  return {
    dir: {
      input: "src",
    },
  };
};
