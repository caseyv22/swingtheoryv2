// Prerenders every public route to a static HTML file in dist/.
//
// Why: this is an SPA. Without prerendering, non-JS crawlers (Bing, most
// AI search crawlers, link previewers) see an empty <div id="root"> and
// homepage-only meta tags. Google eventually renders the JS, everyone
// else mostly doesn't. Prerendering writes the full rendered HTML — body
// content, per-route title/description/canonical/OG, and the JSON-LD that
// <JsonLd> emits through Helmet — into real .html files that Cloudflare
// Pages serves at clean URLs (dist/simulators.html → /simulators).
//
// Runs as part of `npm run build`, after `vite build`:
//   1. Builds src/entry-server.tsx with vite's SSR mode into dist-ssr/.
//   2. Uses dist/index.html (the built SPA shell) as the template.
//   3. Writes dist/spa/index.html — the untouched shell plus a noindex
//      meta — which public/_redirects points the /* catch-all at (as
//      "/spa/", the directory form). Non-prerendered routes (checkout
//      flows, /admin, program slugs created later in the admin panel)
//      load this clean shell and render client-side, instead of flashing
//      prerendered homepage content.
//
//      IMPORTANT: this must be a nested directory index (dist/spa/index.html
//      served at "/spa/"), NOT a top-level file like dist/spa.html served
//      at "/spa". Cloudflare Pages auto-redirects any directly-resolved
//      top-level "name.html" to its extensionless "/name" — which then
//      re-matches the /* catch-all, gets rewritten back to "name.html",
//      and redirects again. That loop shipped to production once already
//      (2026-07-21, swingtheory.golf/spa 503-looped for several minutes)
//      and took the whole site down. "/spa/" is already a canonical
//      directory-index URL (same reason root "/" → index.html never
//      redirects), so there's nothing left to redirect. Do not rename
//      this back to a bare top-level file.
//   4. For each route in scripts/routes.mjs: renders the app, strips the
//      shell's homepage-default title/description/OG tags, injects the
//      route's Helmet-managed head tags, and writes the flat .html file.
//   5. Removes dist-ssr/.
//
// Cloudflare Pages behavior this relies on: static assets are served in
// preference to the /* 200 rewrite in _redirects, and flat HTML files
// resolve to extensionless clean URLs (simulators.html → /simulators).
// This part IS verified against the live deployment — the 503 loop above
// was specifically the fallback shell's own filename, not this mechanism.
//
// The <meta name="prerender-path"> marker tells src/main.tsx whether the
// served HTML matches the URL being viewed: match → hydrateRoot, no match
// (spa/ fallback) → plain client render.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { routes } from "./routes.mjs";

const DIST = resolve("dist");
const SSR_OUT = resolve("dist-ssr");

// 1. Build the SSR entry. configFile picks up the same plugins/aliases as
// the client build (@vitejs/plugin-react, "@" → src).
await build({
  configFile: "vite.config.ts",
  logLevel: "warn",
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist-ssr",
    emptyOutDir: true,
  },
  // react-helmet-async ships CJS with exports Node's ESM interop can't
  // statically resolve — bundle it into the SSR entry instead of leaving
  // it externalized.
  ssr: { noExternal: ["react-helmet-async"] },
});

const { render } = await import(
  pathToFileURL(resolve(SSR_OUT, "entry-server.js")).href
);

// 2. Template = the built SPA shell (vite has already injected the hashed
// /assets/*.js and *.css tags into it).
const template = readFileSync(resolve(DIST, "index.html"), "utf8");

// 3. SPA fallback shell for everything that is NOT prerendered. noindex:
// this file only ever backs client-rendered routes (checkout, admin,
// admin-created program slugs); it must never compete in search results.
// Written as a nested directory index (dist/spa/index.html, served at
// "/spa/") on purpose — see the top-of-file note on why a bare top-level
// "spa.html" caused a redirect loop in production.
mkdirSync(resolve(DIST, "spa"), { recursive: true });
writeFileSync(
  resolve(DIST, "spa", "index.html"),
  template.replace(
    "</head>",
    '  <meta name="robots" content="noindex" />\n  </head>',
  ),
);

// Strip the shell's baked-in homepage head so each route's Helmet output
// fully owns title/description/OG. Keeps charset/viewport/fonts/assets.
function stripDefaultHead(html) {
  return html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/, "")
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/>\n?/, "")
    .replace(/[ \t]*<!--[\s\S]*?Open Graph[\s\S]*?-->\n?/, "")
    .replace(/[ \t]*<meta property="og:[\s\S]*?\/>\n?/g, "")
    .replace(/[ \t]*<meta name="twitter:[\s\S]*?\/>\n?/g, "");
}

// 4. Render each route and write its flat HTML file.
let failed = 0;
for (const { path } of routes) {
  let rendered;
  try {
    rendered = render(path);
  } catch (err) {
    failed += 1;
    console.error(`✗ prerender failed for ${path}:`, err);
    continue;
  }
  const { html, helmet } = rendered;

  const head = [
    helmet?.title?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
    `<meta name="prerender-path" content="${path}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const page = stripDefaultHead(template)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  const outFile =
    path === "/"
      ? resolve(DIST, "index.html")
      : resolve(DIST, `${path.slice(1)}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, page);
  console.log(`✓ prerendered ${path} → ${outFile.replace(DIST, "dist")}`);
}

// 5. Clean up the SSR bundle — it must not be deployed.
rmSync(SSR_OUT, { recursive: true, force: true });

if (failed > 0) {
  console.error(`Prerender finished with ${failed} failed route(s).`);
  process.exit(1);
}
console.log(`Prerendered ${routes.length} routes + spa/index.html fallback.`);
