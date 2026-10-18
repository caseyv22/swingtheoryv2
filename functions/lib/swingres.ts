import type { Env } from "./db";

// SwingRes handoff for the signed-agreement membership checkout.
//
// SwingRes (res.swingtheory.golf) owns the membership agreement text, the member's profile and
// the signed PDF; this site owns the Square charge. Three calls:
//   - fetchCurrentAgreement: the agreement text staff maintain in SwingRes (public endpoint)
//   - checkEligibility:      is this email already an active member? (asked BEFORE any charge)
//   - provisionMembership:   create the membership + signed PDF + member invite (AFTER the charge)
//
// provisionMembership NEVER throws, same contract as mm-provisioning.ts: by the time it runs the
// card has been charged, so a SwingRes hiccup must come back as a result the caller can log and
// alert staff about, not as an exception that fails the checkout.

const FETCH_TIMEOUT_MS = 8_000;
// Creating the membership renders and stores the signed PDF and sends the invite, give it longer.
const PROVISION_TIMEOUT_MS = 25_000;

/** Only Green Jacket Solo goes through the agreement flow (Group is unchanged). */
export function swingresPlanIdFor(env: Env, planSlug: string): string | null {
  if (planSlug !== "green-jacket-solo") return null;
  return env.SWINGRES_PLAN_ID_GREEN_JACKET_SOLO?.trim() || null;
}

/**
 * The agreement flow is on for a plan only when SwingRes is fully configured for it. Returns the
 * SwingRes plan id, or null (flow off: checkout behaves as it did before this feature).
 */
export function agreementFlowPlanId(env: Env, planSlug: string): string | null {
  if (!env.SWINGRES_API_URL?.trim() || !env.SWINGRES_API_SECRET?.trim()) return null;
  return swingresPlanIdFor(env, planSlug);
}

function baseUrl(env: Env): string {
  return (env.SWINGRES_API_URL ?? "").trim().replace(/\/+$/, "");
}

export type CurrentAgreement = { id: string; versionNumber: number; bodyText: string };

/** The current agreement text from SwingRes, or null when it can't be read. */
export async function fetchCurrentAgreement(env: Env): Promise<CurrentAgreement | null> {
  try {
    const res = await fetch(`${baseUrl(env)}/membership-agreement`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: { id?: string; version_number?: number; body_text?: string } | null;
    };
    const c = data.content;
    if (!c?.id || typeof c.version_number !== "number" || !c.body_text) return null;
    return { id: c.id, versionNumber: c.version_number, bodyText: c.body_text };
  } catch {
    return null;
  }
}

export type EligibilityResult =
  | { ok: true; eligible: boolean }
  | { ok: false; error: string };

/** Fails closed: any error is { ok: false }, and the caller must not charge. */
export async function checkEligibility(env: Env, email: string): Promise<EligibilityResult> {
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

export type ProvisionArgs = {
  swingresPlanId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  squareSubscriptionId: string;
  squarePlanVariationId: string;
  agreement: {
    agreementContentId: string;
    typedSignature: string;
    monthlyFee: string;
    firstMonthTerms?: string;
    openedAt?: string | null;
    scrollCompletedAt?: string | null;
    signedAt: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type ProvisionResult =
  | {
      ok: true;
      duplicate: boolean;
      customerId: string;
      subscriptionId: string;
      agreementAcceptanceId: string;
      inviteSent: boolean;
      agreementPdfBase64: string | null;
    }
  | { ok: false; error: string };

export async function provisionMembership(env: Env, args: ProvisionArgs): Promise<ProvisionResult> {
  try {
    const res = await fetch(`${baseUrl(env)}/internal/memberships`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": env.SWINGRES_API_SECRET ?? "",
      },
      body: JSON.stringify({
        membershipPlanId: args.swingresPlanId,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone || undefined,
        squareSubscriptionId: args.squareSubscriptionId,
        squarePlanVariationId: args.squarePlanVariationId,
        agreement: {
          ...args.agreement,
          firstMonthTerms: args.agreement.firstMonthTerms || undefined,
        },
      }),
      signal: AbortSignal.timeout(PROVISION_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as {
      duplicate?: boolean;
      customerId?: string;
      subscriptionId?: string;
      agreementAcceptanceId?: string;
      inviteSent?: boolean;
      agreementPdfBase64?: string | null;
      error?: { message?: string };
    };
    if (!res.ok || !body.customerId || !body.subscriptionId || !body.agreementAcceptanceId) {
      return { ok: false, error: body.error?.message || `SwingRes HTTP ${res.status}` };
    }
    return {
      ok: true,
      duplicate: body.duplicate === true,
      customerId: body.customerId,
      subscriptionId: body.subscriptionId,
      agreementAcceptanceId: body.agreementAcceptanceId,
      inviteSent: body.inviteSent === true,
      agreementPdfBase64: body.agreementPdfBase64 ?? null,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SwingRes call failed" };
  }
}
