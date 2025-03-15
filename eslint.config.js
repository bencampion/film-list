import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import ymlPLugin from "eslint-plugin-yml";
import globals from "globals";

export default defineConfig(
  globalIgnores(["_site/**", ".cache/**"]),
  {
    extends: [js.configs.recommended],
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
    },
    plugins: { import: importPlugin },
    rules: {
      "import/order": [
        "error",
        { alphabetize: { order: "asc", caseInsensitive: true } },
      ],
    },
  },
  {
    extends: [markdown.configs.recommended],
    files: ["**/*.md"],
    language: "markdown/gfm",
  },
  {
    extends: [json.configs.recommended],
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
  },
  {
    extends: [
      ymlPLugin.configs["flat/standard"],
      ymlPLugin.configs["flat/prettier"],
    ],
    files: ["**/*.{yml,yaml}"],
    rules: {
      "yml/no-empty-mapping-value": "off",
    },
  },
);
