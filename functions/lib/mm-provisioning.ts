import type { Env } from "./db";

// mm-api (Sync) provisioning handoff. Extracted from program-checkout.ts so
// both the one-shot program checkout AND the Mini Mulligans admin activate
// endpoint provision Sync through one code path.
//
// Contract: NEVER throws. By the time we call this the money side has
// already happened (a one-time payment, or a subscription that fired its
// first charge), so a Sync hiccup must not fail the caller. Returns a
// { ok, action?, enrollmentId?, error? } result the caller logs and, on
// failure, surfaces to staff so a member can be added in Sync by hand.

// Returns today's date in America/Los_Angeles as "YYYY-MM-DD". Cloudflare
// Workers run in UTC, so a naive toISOString() could shift the date by a
// day for late-night Pacific customers. payment_date represents "the day
// the customer paid, from their perspective."
export function pacificDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date());
}

export async function provisionInMmApi(
  env: Env,
  args: {
    source: string;
    programSlug: string;
    programName: string;
    paymentRef: string;
    paymentAmountCents: number;
    fullName: string;
    email: string;
    phone: string;
    childFirstName: string;
    childAge: number | null;
  },
): Promise<{ ok: boolean; action?: string; enrollmentId?: string; error?: string }> {
  if (!env.MM_API_BASE_URL || !env.INTERNAL_PROVISIONING_SECRET) {
    return { ok: false, error: "mm-api not configured (missing env vars)" };
  }
  try {
    const res = await fetch(`${env.MM_API_BASE_URL}/internal/enrollments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": env.INTERNAL_PROVISIONING_SECRET,
      },
      body: JSON.stringify({
        source: args.source,
        payment_ref: args.paymentRef,
        payment_amount_cents: args.paymentAmountCents,
        payment_date: pacificDateString(),
        program_slug: args.programSlug,
        full_name: args.fullName,
        email: args.email,
        phone: args.phone || undefined,
        child_first_name: args.childFirstName || undefined,
        child_age: args.childAge ?? undefined,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      action?: string;
      enrollment_id?: string;
      error?: string;
    };
    if (!res.ok || !body.ok) {
      return { ok: false, action: body.action, error: body.error || `mm-api HTTP ${res.status}` };
    }
    return { ok: true, action: body.action, enrollmentId: body.enrollment_id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "mm-api call failed" };
  }
}
