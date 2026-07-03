// Builds public sitemap.xml from a static route list.
// Run automatically as part of `npm run build`.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "https://swingtheory.golf";
const routes = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/simulators", priority: 0.9, changefreq: "monthly" },
  { path: "/lessons", priority: 0.8, changefreq: "monthly" },
  { path: "/memberships", priority: 0.8, changefreq: "monthly" },
  { path: "/programs", priority: 0.7, changefreq: "monthly" },
  { path: "/league", priority: 0.8, changefreq: "weekly" },
  { path: "/programs/mini-mulligans", priority: 0.7, changefreq: "monthly" },
  { path: "/programs/summer-womens", priority: 0.7, changefreq: "monthly" },
  { path: "/programs/summer-seniors", priority: 0.7, changefreq: "monthly" },
  { path: "/events", priority: 0.8, changefreq: "monthly" },
  { path: "/visit", priority: 0.7, changefreq: "monthly" },
  { path: "/faq", priority: 0.6, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "yearly" },
];

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
