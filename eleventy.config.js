import tailwind from "@tailwindcss/postcss";
import cssnano from "cssnano";
import postcss from "postcss";
import prettier from "prettier";

/** @param {import("@11ty/eleventy/UserConfig").default} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addTransform("prettier", function (content) {
    if (this.page.outputPath?.endsWith(".html")) {
      return prettier.format(content, { parser: "html" });
    }
    return content;
  });

  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: function (inputContent) {
      return async (data) => {
        const result = await postcss([
          tailwind,
          ...(process.NODE_ENV === "production" ? [cssnano] : []),
        ]).process(inputContent, {
          from: data.page.inputPath,
          to: data.page.outputPath,
        });
        return result.css;
      };
    },
  });

  return {
    dir: {
      input: "src",
    },
  };
}
