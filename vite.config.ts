import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    // Rollup's default content hashes use base64url, which can produce
    // filenames ending in `-` or `_` right before the extension (e.g.
    // `index-Bp1AXt1-.js`). Cloudflare Pages' router mishandles the
    // trailing `-` and returns the SPA fallback HTML instead of the JS
    // asset, breaking every page whose HTML references it. Force a hex
    // hash — 0-9a-f only, no separator characters — so the emitted
    // filename can never end in `-` or `_`.
    rollupOptions: {
      output: {
        // hex encoding = 0-9a-f only, so the emitted filename can
        // never end in `-` or `_` right before the extension.
        // Requires Rollup 4.14+ (Vite 5.2+ bundles it).
        hashCharacters: "hex",
      },
    },
  },
});
