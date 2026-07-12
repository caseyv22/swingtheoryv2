import { json } from "../lib/http";
import { retrieveCatalogItem, SquareApiError } from "../lib/square";
import { membershipPlans } from "../../src/data/memberships";
import type { Env } from "../lib/db";

// GET /api/membership-description?slug=green-jacket-solo
//
// Returns the live description for a membership plan's parent Square item.
// Called by MembershipCheckout.tsx on mount so the Order Summary reads the
// text Casey maintains in Square Dashboard instead of a hardcoded string.
// Change the description in Square, wait for edge cache to expire (5 min),
// the checkout page picks it up — no deploy.
//
// Response shape:
//   { name, description, descriptionHtml? }
//
// Empty description is a valid response — the page falls back to the
// static plan.headline in that case. 400 on unknown slug, 404 if the plan
// doesn't have squareItemId wired, 502 on Square errors.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";

  // Server-side allowlist. Never trust a browser-supplied item id — this
  // endpoint only reads a whitelisted set of catalog items we've explicitly
  // wired up as membership plans.
  const plan = membershipPlans.find((p) => p.slug === slug);
  if (!plan) {
    return json({ error: "Unknown plan." }, 400);
  }
  if (!plan.squareItemId) {
    return json({ error: "No description wired for this plan." }, 404);
  }

  try {
    const item = await retrieveCatalogItem(env, plan.squareItemId);
    return new Response(
      JSON.stringify({
        name: item.name,
        description: item.description,
        descriptionHtml: item.descriptionHtml,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          // 5 min at the edge, 5 min for the browser. Description changes
          // rarely (Casey edits copy in Square Dashboard maybe a few times
          // a year); stale for 5 min is fine and saves a Square API call
          // on every checkout page load.
          "cache-control": "public, max-age=300",
        },
      },
    );
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json({ error: "Couldn't fetch description." }, 502);
  }
};
