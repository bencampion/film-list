// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://bencampion.github.io",
  base: "/film-list",
  vite: {
    plugins: [tailwindcss()],
  },
});
