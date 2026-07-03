# swingtheoryv2

Rebuild of [swingtheory.golf](https://swingtheory.golf) on Vite + React + Cloudflare Pages.

Source of truth for positioning, SEO strategy, brand, and technical decisions: [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + React Router
- **Hosting:** Cloudflare Pages
- **Form endpoints:** Cloudflare Pages Functions (`/functions/api/*`)
- **Email:** Resend
- **Booking:** deep-link to registrygolf.com

## Getting started

```bash
npm install
cp .env.example .env.local  # add your Resend + Turnstile keys
npm run dev
```

Open http://localhost:5173.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + Vite build + sitemap generation
- `npm run preview` — preview the production build
- `npm run deploy` — build and deploy to Cloudflare Pages via Wrangler

## Structure

```
src/
  components/   UI primitives + forms
  pages/        Route components
  data/         Single source of truth (NAP, memberships, programs, FAQs)
  schema/       JSON-LD builders
  hooks/        useFormSubmit
  lib/          Zod validation, class-name helper
functions/api/  Cloudflare Pages Functions (contact, events, league,
                membership, program-interest — all Resend)
public/         _redirects, _headers, robots.txt
scripts/        generate-sitemap.mjs (runs on build)
```

## NAP source of truth

Never hardcode business info. Import from `src/data/site-config.ts`.

## Environment variables (Cloudflare Pages)

Set in Cloudflare dashboard under _Project → Settings → Environment variables_:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` — `info@swingtheory.golf`
- `CONTACT_FROM_EMAIL` — `noreply@swingtheory.golf` (must be a verified Resend sender)
- `TURNSTILE_SITE_KEY` (public, exposed on the client)
- `TURNSTILE_SECRET_KEY` (server only)

## Migration checklist (from WordPress)

- [ ] Confirm every old URL has a mapping in `public/_redirects`
- [ ] Verify Rank Math meta titles/descriptions are matched or improved
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Submit `sitemap.xml` to Bing Webmaster Tools (feeds ChatGPT web search)
- [ ] GA4 tag installed and verified
- [ ] Lighthouse mobile ≥ 95 across all pages
