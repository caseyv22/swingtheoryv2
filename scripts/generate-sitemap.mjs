// Builds public sitemap.xml from the shared route list.
// Run automatically as part of `npm run build`.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { routes } from "./routes.mjs";

const BASE = "https://swingtheory.golf";

const today = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${BASE}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const out = resolve("dist/sitemap.xml");
writeFileSync(out, xml);
console.log(`Wrote ${out}`);
