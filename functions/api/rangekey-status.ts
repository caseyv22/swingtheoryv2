import { rangeKeyCheckoutEnabled, type RangeKeyEnv } from "../lib/rangekey-swingres";

// GET /api/rangekey-status -> { enabled }
// The RangeKey card shows Buy buttons only when this says true. Never leaks which env vars are set.
export const onRequestGet: PagesFunction<RangeKeyEnv> = async ({ env }) => {
  return new Response(JSON.stringify({ enabled: rangeKeyCheckoutEnabled(env) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
};
