// Per-route Open Graph tag rewriter.
//
// Problem: this is a client-rendered React SPA. React Helmet in <SEO />
// updates <title>, meta[name=description], and og:* / twitter:* tags on
// every route change — but that only runs in browsers that execute JS.
// iMessage, Slack, Facebook, LinkedIn, Discord, and Google's initial
// crawler read the raw HTML. That raw HTML is a single index.html file
// that ships with the HOMEPAGE tags baked in (see index.html), so every
// URL shared as a link previews as the homepage.
//
// Fix: this Pages middleware intercepts every routed request, waits for
// context.next() to resolve to whatever Pages would have served (the SPA
// fallback returns index.html for any unknown path), then rewrites the
// four tags that drive social previews: <title>, meta[name=description],
// og:title/description/url, twitter:title/description. HTMLRewriter is a
// streaming rewriter — negligible overhead per request.
//
// Only rewrites route paths that appear in ROUTE_META below. Anything
// else (assets, API, admin, /analyze, uncatalogued deep links) passes
// through untouched, so the raw index.html defaults apply.

import type { Env } from "./lib/db";

// Minimal Cloudflare Workers HTMLRewriter type shims. The project's
// tsconfig doesn't include @cloudflare/workers-types, so `HTMLRewriter`
// and its `Element` API aren't in the default TS lib. Declare just what
// we use here — no extra dependency, no tsconfig change.
type CFElement = {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  setInnerContent(content: string, options?: { html?: boolean }): void;
};
type CFHandler = { element(el: CFElement): void };
type CFRewriter = {
  on(selector: string, handler: CFHandler): CFRewriter;
  transform(response: Response): Response;
};
declare const HTMLRewriter: new () => CFRewriter;

type Meta = { title: string; description: string };

// Match src/pages/*.tsx SEO calls one-to-one. If a page's SEO tags change,
// update this map to match. Program subpages (/programs/*) fall back to a
// generic Programs entry via metaFor().
const ROUTE_META: Record<string, Meta> = {
  "/": {
    title:
      "Indoor Golf and Golf Simulators in Old Town Pasadena | Swing Theory",
    description:
      "Swing Theory is an indoor golf studio in Old Town Pasadena. Four wide simulator bays, tour-grade launch monitors, 100+ world courses, lessons, leagues, and private events.",
  },
  "/simulators": {
    title: "Golf Simulator Rental in Pasadena | Swing Theory Indoor Golf",
    description:
      "Rent a golf simulator bay in Old Town Pasadena. Four wide bays running Uneekor launch monitors and GSPro simulation, 100+ world courses. Open 7 days a week.",
  },
  "/lessons": {
    title: "Golf Lessons in Pasadena | Swing Theory Indoor Golf",
    description:
      "Private golf lessons in Old Town Pasadena. Data-backed coaching with tour-grade launch monitors, slow-motion swing replay, and independent instructors for every level.",
  },
  "/memberships": {
    title: "Indoor Golf Memberships in Pasadena | Swing Theory",
    description:
      "Join the Swing Theory indoor golf membership program in Old Town Pasadena. Monthly bay hours, extended hours booking, member pricing, and league play options.",
  },
  "/programs": {
    title:
      "Golf Programs in Pasadena: Leagues, Juniors, Summer Series | Swing Theory",
    description:
      "Indoor golf programs at Swing Theory in Old Town Pasadena: Swing Theory Golf League, Mini Mulligans junior program, and summer series for women and seniors.",
  },
  "/events": {
    title:
      "Private Event Venue in Pasadena: Corporate, Birthday, Group | Swing Theory",
    description:
      "Host your private event at Swing Theory Indoor Golf in Old Town Pasadena. Corporate outings, birthdays, bachelor parties, and buyouts for groups from 4 to 40+.",
  },
  "/visit": {
    title: "Visit Swing Theory, 50 S De Lacey Ave, Old Town Pasadena",
    description:
      "Swing Theory Indoor Golf is at 50 S De Lacey Ave #200 in the heart of Old Town Pasadena. Hours, parking, and directions.",
  },
  "/league": {
    title: "Swing Theory Golf League, Indoor Golf League in Pasadena",
    description:
      "Weekly indoor golf league at Swing Theory in Old Town Pasadena. Match play with handicaps, live standings, season prizes. Open to individuals and teams.",
  },
  "/contact": {
    title: "Contact Swing Theory Indoor Golf, Pasadena",
    description:
      "Contact Swing Theory Indoor Golf in Old Town Pasadena. Call, email, or use the contact form and we'll follow up shortly.",
  },
  "/faq": {
    title: "Swing Theory FAQ, Indoor Golf in Pasadena",
    description:
      "Frequently asked questions about Swing Theory Indoor Golf in Old Town Pasadena: pricing, rentals, memberships, lessons, and events.",
  },
  "/book": {
    title: "Book a bay, Swing Theory Indoor Golf Pasadena",
    description:
      "Reserve a simulator bay at Swing Theory Indoor Golf in Old Town Pasadena.",
  },
};

// Routes that scripts/prerender.mjs writes as static HTML at build time
// (mirror of scripts/routes.mjs — update both together). Those files
// already carry their exact per-route tags plus JSON-LD, so rewriting
// them here would at best re-apply the same values and at worst clobber
// them if SEO.tsx and ROUTE_META ever drift. Skip them entirely; this
// middleware now only rewrites tags on responses for non-prerendered
// routes (admin-created /programs/:slug pages and other uncatalogued
// routes), which Cloudflare's default SPA fallback serves as the root
// homepage HTML — see public/_redirects for why there's no dedicated
// fallback file anymore.
const PRERENDERED = new Set([
  "/",
  "/simulators",
  "/lessons",
  "/memberships",
  "/programs",
  "/league",
  "/programs/mini-mulligans",
  "/programs/summer-womens",
  "/programs/summer-seniors",
  "/events",
  "/visit",
  "/faq",
  "/contact",
]);

// Generic fallbacks for known route prefixes. Program subpages have their
// own admin-editable name/description in D1 (ProgramDetail.tsx uses those
// at render time), but we don't want to fetch D1 in every middleware
// request just for OG tags — the generic Programs entry is close enough
// for social previews, and Google will pick up the exact per-page metadata
// after crawling with JS.
function metaFor(path: string): Meta | null {
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (ROUTE_META[normalized]) return ROUTE_META[normalized];
  if (normalized.startsWith("/programs/")) return ROUTE_META["/programs"];
  return null;
}

// Rewrites content attribute on any meta tag whose property/name matches
// one of the OG/Twitter tags. Filter is applied in HTMLRewriter's on()
// selector; this class only knows the value to set.
class ContentSetter {
  constructor(private value: string) {}
  element(el: CFElement) {
    el.setAttribute("content", this.value);
  }
}

// Replaces <title> inner text. HTMLRewriter's setInnerContent overwrites
// the entire body of the element with the string as-is; we pass html:false
// so brackets/apostrophes are treated as text, not markup.
class TitleSetter {
  constructor(private value: string) {}
  element(el: CFElement) {
    el.setInnerContent(this.value, { html: false });
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Fast-path out for anything that isn't an SPA route request:
  //   - /api/*     Pages Functions — served by their own handlers
  //   - /admin*    admin SPA route; behind Cloudflare Access, no need for
  //                per-page OG since it's not shareable
  //   - /analyze*  static HTML file with its own hardcoded OG tags
  //   - any path with a dot — asset request (css/js/img/font/etc.)
  if (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/analyze") ||
    path.includes(".")
  ) {
    return context.next();
  }

  // Prerendered static pages own their head tags — pass through untouched.
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (PRERENDERED.has(normalizedPath)) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const meta = metaFor(path);
  if (!meta) return response;

  const canonicalUrl = `https://swingtheory.golf${
    path === "/" ? "" : path.replace(/\/+$/, "")
  }`;
  const title = new ContentSetter(meta.title);
  const desc = new ContentSetter(meta.description);
  const urlSetter = new ContentSetter(canonicalUrl);

  return new HTMLRewriter()
    .on("title", new TitleSetter(meta.title))
    .on('meta[name="description"]', desc)
    .on('meta[property="og:title"]', title)
    .on('meta[property="og:description"]', desc)
    .on('meta[property="og:url"]', urlSetter)
    .on('meta[name="twitter:title"]', title)
    .on('meta[name="twitter:description"]', desc)
    .transform(response);
};
