const prettier = require("prettier");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("prettier", function (content) {
    if (this.page.outputPath?.endsWith(".html")) {
      return prettier.format(content, { parser: "html" });
    }
    return content;
  });
};
