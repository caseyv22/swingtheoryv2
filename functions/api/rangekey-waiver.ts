import { json } from "../lib/http";
import { fetchCurrentWaiver, rangeKeyCheckoutEnabled, type RangeKeyEnv } from "../lib/rangekey-swingres";

// GET /api/rangekey-waiver
// The liability waiver text for the RangeKey checkout, read from SwingRes (where staff edit it).
// The browser never talks to SwingRes directly.
export const onRequestGet: PagesFunction<RangeKeyEnv> = async ({ env }) => {
  const headers = { "Cache-Control": "no-store" };
  if (!rangeKeyCheckoutEnabled(env)) return json({ enabled: false }, 200, headers);
  const waiver = await fetchCurrentWaiver(env);
  if (!waiver) {
    return json(
      { enabled: true, error: "The waiver couldn't be loaded right now. Please try again in a moment." },
      503,
      headers,
    );
  }
  return json(
    { enabled: true, contentId: waiver.id, versionNumber: waiver.versionNumber, bodyText: waiver.bodyText },
    200,
    headers,
  );
};
