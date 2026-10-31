import type { Env } from "./db";

// SwingRes handoff for the RangeKey / RangeKey+ checkout.
//
// RangeKey is a one-time purchase (a Square payment, not a Square subscription): SwingRes gives
// the buyer a prepaid-hours membership (plan with expiration_rule = hours_played and total_hours)
// and sends the portal invite. The route below does not exist in SwingRes yet, see the issue
// linked from the PR. Until it ships, leave SWINGRES_PLAN_ID_RANGEKEY* unset: checkout stays off.
//
//   POST {SWINGRES_API_URL}/internal/rangekey-purchases        (X-Internal-Secret)
//     { membershipPlanId, firstName, lastName, email, phone?, squarePaymentId,
//       squareVariationId, amountCents, paidAt }
//   -> 201/200 { duplicate, customerId, subscriptionId, hoursGranted, inviteSent }
//   Idempotent on squarePaymentId.
//
// Env (Cloudflare Pages): SWINGRES_API_URL + SWINGRES_API_SECRET (already used by Green Jacket),
// plus SWINGRES_PLAN_ID_RANGEKEY and SWINGRES_PLAN_ID_RANGEKEY_PLUS (the SwingRes membership_plan.id
// of each plan, per SwingRes environment).

export type RangeKeyEnv = Env & {
  SWINGRES_PLAN_ID_RANGEKEY?: string;
  SWINGRES_PLAN_ID_RANGEKEY_PLUS?: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const PROVISION_TIMEOUT_MS = 25_000;

function baseUrl(env: Env): string {
  return (env.SWINGRES_API_URL ?? "").trim().replace(/\/+$/, "");
}

/** SwingRes plan id for a RangeKey option, or null when the flow isn't fully configured. */
export function rangeKeyPlanId(env: RangeKeyEnv, optionSlug: string): string | null {
  if (!env.SWINGRES_API_URL?.trim() || !env.SWINGRES_API_SECRET?.trim()) return null;
  const id =
    optionSlug === "rangekey"
      ? env.SWINGRES_PLAN_ID_RANGEKEY
      : optionSlug === "rangekey-plus"
        ? env.SWINGRES_PLAN_ID_RANGEKEY_PLUS
        : undefined;
  return id?.trim() || null;
}

/** Checkout is on only when BOTH options are configured. */
export function rangeKeyCheckoutEnabled(env: RangeKeyEnv): boolean {
  return !!rangeKeyPlanId(env, "rangekey") && !!rangeKeyPlanId(env, "rangekey-plus");
}

export type RangeKeyProvisionArgs = {
  membershipPlanId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  squarePaymentId: string;
  squareVariationId: string;
  amountCents: number;
  paidAt: string;
};

export type RangeKeyProvisionResult =
  | {
      ok: true;
      duplicate: boolean;
      customerId: string;
      subscriptionId: string;
      hoursGranted: number | null;
      inviteSent: boolean;
    }
  | { ok: false; error: string };

/**
 * Create the prepaid-hours membership in SwingRes. NEVER throws: by the time this runs the card
 * has been charged, so a SwingRes failure comes back as a result the caller logs and alerts staff
 * about. Safe to retry (idempotent on squarePaymentId).
 */
export async function provisionRangeKey(
  env: RangeKeyEnv,
  args: RangeKeyProvisionArgs,
): Promise<RangeKeyProvisionResult> {
  try {
    const res = await fetch(`${baseUrl(env)}/internal/rangekey-purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": env.SWINGRES_API_SECRET ?? "",
      },
      body: JSON.stringify({ ...args, phone: args.phone || undefined }),
      signal: AbortSignal.timeout(PROVISION_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as {
      duplicate?: boolean;
      customerId?: string;
      subscriptionId?: string;
      hoursGranted?: number;
      inviteSent?: boolean;
      error?: { message?: string };
    };
    if (!res.ok || !body.customerId || !body.subscriptionId) {
      return { ok: false, error: body.error?.message || `SwingRes HTTP ${res.status}` };
    }
    return {
      ok: true,
      duplicate: body.duplicate === true,
      customerId: body.customerId,
      subscriptionId: body.subscriptionId,
      hoursGranted: typeof body.hoursGranted === "number" ? body.hoursGranted : null,
      inviteSent: body.inviteSent === true,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SwingRes call failed" };
  }
}

/** Fails closed: any error is { ok: false } and the caller must not charge. */
export async function rangeKeyEligibility(
  env: Env,
  email: string,
): Promise<{ ok: true; eligible: boolean } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${baseUrl(env)}/internal/membership-eligibility?email=${encodeURIComponent(email)}`,
      {
        headers: { "X-Internal-Secret": env.SWINGRES_API_SECRET ?? "" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (!res.ok) return { ok: false, error: `SwingRes eligibility HTTP ${res.status}` };
    const data = (await res.json()) as { eligible?: boolean };
    if (typeof data.eligible !== "boolean") return { ok: false, error: "SwingRes eligibility: bad response" };
    return { ok: true, eligible: data.eligible };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SwingRes eligibility call failed" };
  }
}
