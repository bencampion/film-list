declare module "eslint-plugin-import" {
  import type { ESLint } from "eslint";
  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module "@11ty/eleventy/UserConfig" {
  // Minimal surface for this project; Eleventy ships JSDoc, not full .d.ts.
  interface UserConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addDataExtension(extension: string, options: any): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addTransform(name: string, callback: any): void;
    addTemplateFormats(formats: string | string[]): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addExtension(extension: string, options: any): void;
  }
  export default UserConfig;
}
