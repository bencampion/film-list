import { pathToFileURL } from "node:url";
import type UserConfig from "@11ty/eleventy/UserConfig";
import tailwind from "@tailwindcss/postcss";
import cssnano from "cssnano";
import postcss from "postcss";
import prettier from "prettier";

export default function (eleventyConfig: UserConfig) {
  eleventyConfig.addDataExtension("ts", {
    read: false,
    parser: async (filePath: string) => {
      const mod = (await import(pathToFileURL(filePath).href)) as {
        default?: unknown;
      };
      return mod.default ?? mod;
    },
  });

  eleventyConfig.addTransform(
    "prettier",
    function (this: { page: { outputPath?: string } }, content: string) {
      if (this.page.outputPath?.endsWith(".html")) {
        return prettier.format(content, { parser: "html" });
      }
      return content;
    },
  );

  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: function (inputContent: string) {
      return async (data: {
        page: { inputPath: string; outputPath: string };
      }) => {
        const result = await postcss([
          tailwind,
          ...(process.env.NODE_ENV === "production" ? [cssnano] : []),
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
