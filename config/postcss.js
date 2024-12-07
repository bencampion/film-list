import postcss from "postcss";
import postcssrc from "postcss-load-config";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
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
}
