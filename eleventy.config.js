import postcss from "./config/postcss.js";
import prettier from "./config/prettier.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addPlugin(prettier);
  eleventyConfig.addPlugin(postcss);
  eleventyConfig.addWatchTarget("./postcss.config.js");
  eleventyConfig.addWatchTarget("./tailwind.config.js");

  return {
    dir: {
      input: "src",
    },
  };
}
