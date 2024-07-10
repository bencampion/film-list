const postcss = require("postcss");
const postcssrc = require("postcss-load-config");

module.exports = function (eleventyConfig) {
  let options, processor;
  eleventyConfig.on("eleventy.before", async () => {
    const config = await postcssrc();
    options = config.options;
    processor = postcss(config.plugins);
  });

  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: function (inputContent) {
      return async (data) => {
        const result = await processor.process(inputContent, {
          from: data.page.inputPath,
          to: data.page.outputPath,
          ...options,
        });
        return result.css;
      };
    },
  });
};
