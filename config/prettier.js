import prettier from "prettier";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addTransform("prettier", function (content) {
    if (this.page.outputPath?.endsWith(".html")) {
      return prettier.format(content, { parser: "html" });
    }
    return content;
  });
}
