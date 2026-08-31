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

declare module "@11ty/eleventy-fetch" {
  interface EleventyFetchResponse {
    url?: string;
    status?: number;
    headers?: Record<string, string>;
    body: unknown;
    cache?: "hit" | "miss";
  }

  export default function EleventyFetch(
    url: string,
    options?: {
      duration?: string;
      type?: "json" | "text" | "buffer" | "xml" | "parsed-xml";
      returnType?: "response";
      fetchOptions?: RequestInit;
      [key: string]: unknown;
    },
  ): Promise<EleventyFetchResponse>;
}
