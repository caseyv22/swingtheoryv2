// Single source of truth for the public, indexable routes of the site.
// Consumed by:
//   - scripts/prerender.mjs        (writes static HTML per route at build time)
//   - scripts/generate-sitemap.mjs (writes dist/sitemap.xml)
//
// functions/_middleware.ts keeps a mirrored PRERENDERED set (the Functions
// bundle shouldn't reach outside functions/), so when a page is added or
// removed, update BOTH this file and that set.
export const routes = [
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
