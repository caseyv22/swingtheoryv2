import { json } from "../lib/http";
import { membershipPlans } from "../../src/data/memberships";
import { agreementTerms } from "../lib/membership-agreement-terms";
import { agreementFlowPlanId, fetchCurrentAgreement } from "../lib/swingres";
import type { Env } from "../lib/db";

// GET /api/membership-agreement?plan=green-jacket-solo
//
// What the checkout page needs to show the membership agreement. { enabled: false } means the
// signed-agreement flow is off for this plan (SwingRes isn't configured, or it's not Solo) and
// the page should behave exactly as before. When it is on, the agreement text comes from
// SwingRes, where staff edit it, together with the fee wording this server will also hand to
// SwingRes at signing. The browser never talks to SwingRes directly.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const slug = new URL(request.url).searchParams.get("plan") ?? "";
  const plan = membershipPlans.find((p) => p.slug === slug);
  const headers = { "Cache-Control": "no-store" };
  if (!plan || !agreementFlowPlanId(env, plan.slug)) {
    return json({ enabled: false }, 200, headers);
  }

  const agreement = await fetchCurrentAgreement(env);
  if (!agreement) {
    return json(
      { enabled: true, error: "The membership agreement couldn't be loaded right now. Please try again in a moment." },
      503,
      headers,
    );
  }
  const { monthlyFee, firstMonthTerms } = agreementTerms(env, plan);
  return json(
    {
      enabled: true,
      contentId: agreement.id,
      versionNumber: agreement.versionNumber,
      bodyText: agreement.bodyText,
      monthlyFee,
      firstMonthTerms,
    },
    200,
    headers,
  );
};
