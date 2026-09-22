import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginAstro from "eslint-plugin-astro";
import { importX } from "eslint-plugin-import-x";
import ymlPlugin from "eslint-plugin-yml";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([".astro/**", ".cache/**", "dist/**"]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,astro}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    plugins: { "import-x": importX },
    rules: {
      "import-x/order": [
        "error",
        { alphabetize: { order: "asc", caseInsensitive: true } },
      ],
    },
  },
  {
    files: ["**/*.{ts,mts,cts,astro}"],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true },
    },
  },
  {
    files: ["**/*.astro"],
    extends: [
      eslintPluginAstro.configs.recommended,
      eslintPluginAstro.configs["jsx-a11y-recommended"],
    ],
    settings: {
      "import-x/parsers": {
        "astro-eslint-parser": [".astro"],
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: "./tsconfig.json",
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    files: ["**/*.md"],
    extends: [markdown.configs.recommended],
    language: "markdown/gfm",
  },
  {
    files: ["**/*.json"],
    extends: [json.configs.recommended],
    ignores: ["package-lock.json"],
    language: "json/json",
  },
  {
    files: ["**/*.{yml,yaml}"],
    extends: [
      ymlPlugin.configs["flat/standard"],
      ymlPlugin.configs["flat/prettier"],
    ],
    rules: {
      "yml/no-empty-mapping-value": "off",
    },
  },
  eslintConfigPrettier,
);
