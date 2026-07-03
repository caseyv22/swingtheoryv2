# Swing Theory — Website Rebuild Spec

> Project brief and working reference for Claude Code. This document is the
> source of truth for positioning, SEO strategy, brand, and technical
> decisions on the new swingtheory.golf.

---

## 1. What we're building

A rebuild of swingtheory.golf, migrating off WordPress onto a fast, static
Cloudflare Pages site. The current site is a six-page brochure that hands
booking off to registrygolf.com. The rebuild fixes speed, security, and
schema control, and adds the content depth needed to actually rank locally.

Ownership: Casey (@caseykim). AI codegen directs the build.

---

## 2. Positioning

**One-line pitch:** Swing Theory is Old Town Pasadena's indoor golf studio —
four wide simulator bays running tour-grade Uneekor launch monitors and
GSPro simulation, with private lessons, private events, and league play,
open seven days a week.

**What this is:** a golf studio for practice, play, and hosting events.

**What this is NOT:** a lounge, sports bar, restaurant, or nightlife
destination. Swing Theory does not sell food or beverage. Guests are
welcome to bring their own food and drinks into the bay during their
booking.

Every piece of copy, every card, every meta description must reflect that.
Cut any language that implies "eat/drink/golf," "full lounge," or "food and
drinks" as a paid offering.

**Primary audiences (in order):**

1. Local golfers wanting to practice year-round or work on their swing
2. Small groups looking for a novel night out (birthdays, dates, corporate)
3. Private lessons and club fittings
4. League players and members

**Core differentiators to lead with everywhere:**

- Location: Old Town Pasadena, 50 S De Lacey Ave — walkable, high foot traffic
- Four wide bays; one can be closed off to become a private suite (with karaoke)
- Tour-grade **Uneekor** launch monitors + **GSPro** simulation
  (ball speed, spin, launch, carry, club-face on every shot)
- 100+ world courses playable
- 5.0 Google rating
- Rental clubs for right and left-handed players
- Open 7 days a week, evenings included

**Bay count phrasing (exact):** "Four wide simulator bays; one can be
closed off to become a private suite when booked for events." Not
"3 open + 1 private" — that phrasing implies a fifth bay exists.

**Membership pricing (Green Jacket, current):**
- Green Jacket Solo — $239/month · unlimited days · 1 hour per day · bring up to 3 guests
- Green Jacket Group — $349/month · two memberships · same perks each

---

## 3. SEO strategy (this drives every content decision)

### Head terms we're competing for

- **"indoor golf near me"** — resolves locally by device geo
- **"indoor golf"**, **"golf simulator near me"** — same
- **"indoor golf pasadena"**, **"golf simulator pasadena"** — exact-match local
- Long tail: "golf lessons pasadena," "private event venue pasadena,"
  "birthday party pasadena," "junior golf pasadena," "indoor golf glendale,"
  "indoor golf burbank," etc.

### Cities to appear for

Pasadena, South Pasadena, San Marino, Alhambra, Arcadia, Glendale, Burbank,
and Los Angeles. These are listed in `LocalBusiness.areaServed` and
referenced naturally (not stuffed) in copy on `/simulators` and `/visit`.

### The three channels, in priority order

**1. Google local pack + organic (highest).** GBP is being fully rebuilt in
parallel — secondary categories, description, services, attributes,
products, weekly posts, review response engine, Q&A seeding. The website
supports this with local-keyword-rich pages, `LocalBusiness` +
`GolfCourse` schema, and identical NAP everywhere.

**2. Yelp + Apple Maps.** Yelp feeds Apple Maps and Siri. Fully building the
Yelp profile with matched hours, keyword-natural About/Specialties, and
check-in promos. The website's role is NAP consistency.

**3. AI visibility (GEO).** ChatGPT web search runs on Bing's index →
submit sitemaps to Bing Webmaster Tools. Perplexity, Google AI Overviews,
and Gemini cite live pages. Our job: lead pages with 40–60 word direct
answers, use Q&A / FAQ formatting, strip promotional language
("premier," "best," "unmatched," "top choice," "act now" — measurably
lower AI citation rates by ~26%), keep content fresh (updated < 30 days
gets 3.2× more citations), and expose author + dateModified in schema.

### On-page rules (apply to every page)

- **H1 must contain the money phrase early.** Homepage: "Indoor golf and
  golf simulators in Old Town Pasadena." Not "Welcome to Swing Theory."
- **Lead with a direct answer.** First 40–60 words of every page answer
  the target query, no marketing preamble.
- **Location anchor on every page.** "Pasadena" or "Old Town Pasadena" in
  H1, first paragraph, and at least one subheading.
- **No promotional adjectives in factual/FAQ copy.**
- **Concrete beats vague.** "Four wide bays, Uneekor launch monitors, GSPro,
  100+ courses" beats "state-of-the-art simulators." Naming Uneekor and
  GSPro explicitly also picks up long-tail SEO ("uneekor golf pasadena,"
  "gspro simulator pasadena").
- **Sentence case everywhere except brand marks.**
- **Short paragraphs, scannable lists.**

### Site structure

| Path | Purpose |
| --- | --- |
| `/` | Homepage |
| `/simulators` | Golf simulator rental Pasadena |
| `/lessons` | Golf lessons + coaches |
| `/memberships` | Membership plans + interest form |
| `/programs` | Programs overview |
| `/programs/league-night` | STGL + signup form |
| `/programs/mini-mulligans` | Junior program + interest form |
| `/programs/summer-womens` | Women's summer + interest form |
| `/programs/summer-seniors` | Seniors summer + interest form |
| `/events` | Private events + inquiry form |
| `/visit` | Location, hours, parking |
| `/faq` | FAQ |
| `/contact` | Contact form |
| `/book` | 302 to registrygolf.com |

Each service page: unique local copy, FAQ block with schema, CTA to
booking (or interest form for membership/programs), real photos from the
June 2025 shoot.

Mini Mulligans is folded into `/programs/mini-mulligans` rather than a
separate `mm.swingtheory.golf` subdomain — one domain, one authority pool.

### Migration must-do

- Preserve slugs where possible; 301 old WP URLs to new equivalents via
  `public/_redirects`.
- Submit sitemap to Google Search Console AND Bing Webmaster Tools.
- Verify Rank Math meta titles/descriptions carried over or improved.

---

## 4. Forms

Membership onboarding is human. There is no "buy now" button — every
membership CTA opens the interest form and a team member follows up.

Endpoints (Cloudflare Pages Functions):

| Route | Form component | Email subject prefix |
| --- | --- | --- |
| `POST /api/contact` | `ContactForm` | `[Contact]` |
| `POST /api/events-inquiry` | `EventInquiryForm` | `[EVENT]` |
| `POST /api/league-signup` | `LeagueSignupForm` | `[LEAGUE]` |
| `POST /api/membership-interest` | `MembershipInterestForm` | `[MEMBERSHIP]` |
| `POST /api/program-interest` | `ProgramInterestForm` | `[PROGRAM · name]` |

All forms: Zod validation, honeypot field, Cloudflare Turnstile,
Resend delivery to `info@swingtheory.golf`.

---

## 5. Brand and design

Reference is the actual Swing Theory Brand Guideline (v1.0 PDF, supplied by
Casey), not the original placeholder mockup. `swing-theory-mockup-v2-brand.html`
(in the project folder) is the current directional reference — same layout
rhythm as the original mockup, reskinned to the real guideline with gold
swapped in for the guideline's maroon accent per Casey's direction.

### Palette

- `--green-900:#041d13` · `--green-800:#063a25` · `--green-700:#064029`
  (brand primary, matches guideline Primary Color 04) · `--green-600:#0a5c39`
- `--cream:#FAFBFF` (off-white page bg, guideline Primary Color 01) · `--paper:#ffffff`
- `--gold:#c8a24a` · `--gold-dk:#a07f2e` (accent — deviates from the
  guideline's maroon `#911A24` at Casey's request; kept from the original
  site since it already existed and reads better for this business)
- `--ink:#1E1E24` (guideline grayscale "Phantom") · `--muted:#6E7180`
  (guideline grayscale "Graphite")
- Full grayscale scale available as Tailwind tokens: `cloud #EDEFF7`,
  `smoke #D3D6E0`, `steel #BCBFCC`, `space #9DA2B3`, `graphite #6E7180`,
  `arsenic #40424D`, `phantom #1E1E24`
- Guideline's maroon `#911A24` and black-only variant are documented but
  intentionally not used site-wide — gold is the accent everywhere.

### Typography

- Single family: `Manrope` (200/300/400/500/600/700/800) for both display
  and body — matches the brand guideline exactly (guideline does not use
  Oxanium/Lato; that was placeholder from before the real guideline existed).
- Loaded via Google Fonts with `display=swap`

### Logo

- Coded as `src/components/Logo.tsx` — inline SVG swoosh mark + "SWING /
  THEORY" wordmark lockup, rendered in `currentColor` so it works on any
  background. Replaces the WordPress PNG logo images in the nav and footer.
- The WP PNG logo URLs (`site.logos.white` / `site.logos.green`) are kept
  only for the `logo` field in JSON-LD schema, which needs a real hosted
  image URL — not used for on-page visual rendering anymore.

### Assets (live URLs from swingtheory.golf/wp-content/uploads)

- Hero video: `2025/07/Swing-Theory-Website-Hero.mp4`
- Hero poster / sim: `2024/12/HOME-GOLF-SIM.jpg`
- Logos (schema only, see above): `2024/12/Swing-Theory-Website-White.png`, `Green.png`
- Interior: `2025/06/DSC07701`, `07806`, `07845`, `07877`, `07885`
- Memberships: `2025/05/Swing-Theory-Memberships-1024x602.jpg`

---

## 6. Technical stack

- **Frontend:** React + Vite + TypeScript + Tailwind
- **Hosting:** Cloudflare Pages
- **API:** Cloudflare Pages Functions (`/functions/api/*`)
- **Email:** Resend
- **Booking:** deep-link to registrygolf.com
- **Analytics:** GA4 only

### Performance non-negotiables

- Lighthouse mobile Performance ≥ 95
- LCP < 2.0s on mobile
- CLS < 0.05
- No render-blocking third-party scripts above the fold
- Images: WebP where possible, `loading="lazy"`, explicit width/height
- Video: `preload="metadata"`, `<source>` with `type`, poster required

### Schema

Every page: `LocalBusiness` (subtype `GolfCourse` /
`SportsActivityLocation`) with NAP, geo, hours, `areaServed` covering
all target cities, `sameAs`, and `aggregateRating`.

Service pages add `Service` schema (linked to `LocalBusiness`).
FAQ page adds `FAQPage`. All builders live in `src/schema/index.ts`.

---

## 7. NAP (source of truth)

- **Name:** Swing Theory Indoor Golf
- **Address:** 50 S De Lacey Ave #200, Pasadena, CA 91105
- **Phone:** (626) 879-5513
- **Email:** info@swingtheory.golf
- **Instagram:** @swingtheory.golf
- **Hours:** Mon–Sat 10:00 AM – 8:00 PM, Sun 10:00 AM – 7:00 PM
- **Website:** https://swingtheory.golf

Nothing hardcodes NAP anywhere else. Import from `src/data/site-config.ts`.

---

## 8. Working style with Claude

- Casey directs; Claude executes.
- Ship working code. Ask before major structural moves (routing, schema
  type changes, plugin/library additions).
- Casey uses `/blunt` and `/brutal` when he wants unhedged critical
  analysis. Take it literally.
- Follow the SEO rules in §3 as hard constraints, not suggestions.

---

## 9. Definition of done for launch

- [ ] All routes built with final copy
- [ ] Real assets from the June 2025 shoot on every page
- [ ] Real Google reviews with attribution in `src/data/reviews.ts`
- [ ] LocalBusiness + FAQPage + Service schema deployed on every page
- [ ] `_redirects` mapping every old WordPress URL
- [ ] `sitemap.xml` + `robots.txt` live
- [ ] Google Search Console + Bing Webmaster Tools verified
- [ ] Lighthouse mobile ≥ 95 across all pages
- [ ] Booking CTAs deep-link correctly to registrygolf.com
- [ ] All five forms live and delivering to info@swingtheory.golf
- [ ] Resend + Turnstile keys set in Cloudflare Pages
- [ ] GA4 installed (single script)
- [ ] DNS switched, old URLs 301'd, sitemap resubmitted

---

*Last updated: 2026-07-03. This spec will evolve as content, design, and
priorities firm up.*
