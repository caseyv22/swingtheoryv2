import { json, readJson } from "../lib/http";
import { sendEmail, renderKv, wrapBrandedEmail } from "../lib/email";
import { logSubmission } from "../lib/submissions";
import { programCheckoutSchema } from "../../src/lib/validation";
import { retrieveCatalogItemVariation, createOneTimePayment, SquareApiError } from "../lib/square";
import type { Env } from "../lib/db";

type ProgramCheckoutRow = {
  id: number;
  slug: string;
  name: string;
  checkout_mode: string;
  square_catalog_id: string;
};

// Programs where the payer is enrolling a child, not themselves. Kept in
// sync with PARENT_ROLE_SLUGS in src/pages/ProgramCheckout.tsx — when we
// add a second parent-role program, promote to a booker_type column on
// programs and drive both files off it.
const PARENT_ROLE_SLUGS = new Set<string>(["mini-mulligans"]);

// Returns today's date in America/Los_Angeles as a "YYYY-MM-DD" string.
// Cloudflare Workers run in UTC, so a naive toISOString() could shift the
// date by a day for late-night Pacific customers. mm-api's payment_date
// column represents "the day the customer paid, from their perspective."
function pacificDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(
    new Date(),
  );
}

// Hand the paid enrollment off to mm-api. Never throws — returns a
// { ok, action?, error? } result so the caller can log the outcome but
// still return success to the customer (their card was already charged).
async function provisionInMmApi(
  env: Env,
  args: {
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
        source: "swingtheoryv2-program-checkout",
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

// One-time program fees (season sign-ups, camps). The Web Payments SDK on
// /programs/checkout tokenizes the card in-browser and posts us the nonce
// (sourceId) — we charge it directly via the Payments API, no card-on-file
// needed since there's nothing to bill again later.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = programCheckoutSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries and try again." }, 400);
  const data = parsed.data;

  // Server-side lookup — never trust a client-supplied catalog id or price.
  // Only published programs explicitly wired for one_time checkout qualify.
  const program = await env.DB.prepare(
    `SELECT id, slug, name, checkout_mode, square_catalog_id FROM programs
     WHERE slug = ? AND published = 1`,
  )
    .bind(data.programSlug)
    .first<ProgramCheckoutRow>();

  if (!program || program.checkout_mode !== "one_time" || !program.square_catalog_id) {
    return json({ error: "That program isn't available for checkout yet." }, 400);
  }

  // Enforce child_first_name server-side for parent-role programs. The
  // client already blocks this, but a hand-crafted request could bypass
  // the form. We don't want to charge a card and then discover mm-api
  // rejects the enrollment for missing child info.
  const isParentRoleProgram = PARENT_ROLE_SLUGS.has(program.slug);
  if (isParentRoleProgram && !data.childFirstName?.trim()) {
    return json({ error: "Please enter your child's first name." }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip");

  try {
    // Price always comes fresh from Square, not from our own DB or the
    // client — a price change in Square shows up immediately, no deploy.
    const item = await retrieveCatalogItemVariation(env, program.square_catalog_id);

    const payment = await createOneTimePayment(env, {
      sourceId: data.sourceId,
      amountMoney: item.priceMoney,
      buyerEmail: data.email,
      note: `${program.name} — ${item.name}`,
    });

    // Hand the paid enrollment off to mm-api so the customer has a Sync
    // login + a paid enrollment when they follow up. Never fails the
    // checkout — the card has already been charged. If mm-api errors, the
    // staff notification and submission log both surface the failure so
    // an admin can manually provision the member from Sync.
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const parsedChildAge = data.childAge ? parseInt(String(data.childAge), 10) : NaN;
    const mmResult = await provisionInMmApi(env, {
      programSlug: program.slug,
      programName: program.name,
      paymentRef: payment.id,
      paymentAmountCents: item.priceMoney.amount,
      fullName,
      email: data.email,
      phone: data.phone || "",
      childFirstName: (data.childFirstName || "").trim(),
      childAge: Number.isFinite(parsedChildAge) ? parsedChildAge : null,
    });
    if (!mmResult.ok) {
      console.error(
        `[program-checkout] mm-api provisioning failed for payment=${payment.id}: ${mmResult.error}`,
      );
    }

    // Staff notification — best-effort. The payment already succeeded by
    // this point, so an email hiccup shouldn't fail the checkout.
    try {
      await sendEmail({
        env,
        subject: `[PROGRAM] New signup: ${data.firstName} ${data.lastName} · ${program.name}`,
        replyTo: data.email,
        html: wrapBrandedEmail({
          title: "New program signup",
          intro: `${data.firstName} ${data.lastName} just paid for ${program.name} through the website checkout.`,
          bodyHtml: renderKv({
            name: fullName,
            email: data.email,
            phone: data.phone || "",
            program: program.name,
            amount: `$${(item.priceMoney.amount / 100).toFixed(2)} ${item.priceMoney.currency}`,
            childFirstName: data.childFirstName || "",
            childAge: data.childAge || "",
            paymentId: payment.id,
            paymentStatus: payment.status,
            syncProvisioning: mmResult.ok
              ? `OK (${mmResult.action}, enrollment ${mmResult.enrollmentId})`
              : `FAILED — ${mmResult.error} (please add member manually in Sync)`,
          }),
        }),
      });
    } catch {
      // swallow — see comment above
    }

    await logSubmission({
      env,
      formType: "program-checkout",
      data: {
        name: fullName,
        email: data.email,
        phone: data.phone || "",
        message: `${program.name} — payment ${payment.id} (${payment.status}), sync=${mmResult.ok ? mmResult.action : "FAILED:" + mmResult.error}`,
        paymentId: payment.id,
        childFirstName: data.childFirstName || "",
        childAge: data.childAge || "",
        syncEnrollmentId: mmResult.enrollmentId || "",
        syncOk: mmResult.ok,
      },
      program: program.name,
      ip,
      userAgent: request.headers.get("user-agent"),
    });

    return json({ ok: true, paymentId: payment.id, status: payment.status });
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json(
      { error: "Something went wrong processing your payment. Please try again." },
      500,
    );
  }
};
