import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import ymlPlugin from "eslint-plugin-yml";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["_site/**", ".cache/**", "types/tmdb.d.ts"]),
  {
    extends: [js.configs.recommended],
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
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
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      parserOptions: { projectService: true },
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
      ymlPlugin.configs["flat/standard"],
      ymlPlugin.configs["flat/prettier"],
    ],
    files: ["**/*.{yml,yaml}"],
    rules: {
      "yml/no-empty-mapping-value": "off",
    },
  },
  eslintConfigPrettier,
);
