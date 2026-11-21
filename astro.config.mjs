// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Never inline assets/scripts: CSP is script-src 'self' without unsafe-inline.
  vite: { build: { assetsInlineLimit: 0 } },
});
