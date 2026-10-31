import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, wrapBrandedEmail } from "../lib/email";
import { logSubmission } from "../lib/submissions";
import { rangeKeyCheckoutSchema } from "../../src/lib/rangekey";
import { rangeKeyOptions } from "../../src/data/memberships";
import { retrieveCatalogItemVariation, createOneTimePayment, SquareApiError } from "../lib/square";
import {
  fetchCurrentWaiver,
  provisionRangeKey,
  rangeKeyEligibility,
  rangeKeyPlanId,
  type RangeKeyEnv,
  type RangeKeyProvisionResult,
} from "../lib/rangekey-swingres";
import { rangeKeyConfirmation } from "../lib/rangekey-confirmation";

// RangeKey / RangeKey+ purchase: charge the Square item once, then create the prepaid-hours
// membership + account in SwingRes. Order matters:
//   1. option, SwingRes config, email eligibility and the accepted waiver are checked BEFORE any charge
//      (anything failing here => "You haven't been charged")
//   2. price is read fresh from Square and must equal the price on the site
//   3. one-time card charge (Payments API)
//   4. SwingRes handoff (membership, hours, invite). Never undoes the charge: a failure marks the
//      staff email [ACTION NEEDED] and the buyer's email says setup is being finished.
export const onRequestPost: PagesFunction<RangeKeyEnv> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = rangeKeyCheckoutSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries and try again." }, 400);
  const data = parsed.data;

  // Server-side allowlist: hours, price and Square variation come from code, never the browser.
  const option = rangeKeyOptions.find((o) => o.slug === data.optionSlug);
  const planId = rangeKeyPlanId(env, data.optionSlug);
  if (!option || !planId) {
    return json({ error: "Online checkout isn't available yet. You haven't been charged." }, 503);
  }

  const ip = request.headers.get("cf-connecting-ip");
  const userAgent = request.headers.get("user-agent");
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const eligibility = await rangeKeyEligibility(env, data.email);
  if (!eligibility.ok) {
    console.error(`[rangekey-checkout] eligibility failed: ${eligibility.error}`);
    return json(
      {
        error:
          "We couldn't verify your account right now, so we haven't charged your card. Please try again in a few minutes, or call us at 626-879-5513.",
      },
      503,
    );
  }
  if (!eligibility.eligible) {
    return json(
      {
        error:
          "This email already has an active Swing Theory membership, so we haven't charged your card. Call us at 626-879-5513 and we'll help you add hours.",
      },
      409,
    );
  }

  // Waiver: the version the buyer scrolled through and ticked must still be the current one.
  const currentWaiver = await fetchCurrentWaiver(env);
  if (!currentWaiver) {
    return json(
      { error: "The waiver couldn't be loaded, so we haven't charged your card. Please try again in a moment." },
      503,
    );
  }
  if (currentWaiver.id !== data.waiver.waiverContentId) {
    return json(
      { error: "The waiver was just updated. Please reload this page and review it again. You haven't been charged." },
      409,
    );
  }
  const waiverAcceptedAt = new Date().toISOString(); // our clock, never the browser's

  try {
    const item = await retrieveCatalogItemVariation(env, option.squareVariationId);
    if (item.priceMoney.amount !== option.priceCents || item.priceMoney.currency !== "USD") {
      console.error(
        `[rangekey-checkout] price mismatch for ${option.slug}: square=${item.priceMoney.amount} site=${option.priceCents}`,
      );
      return json(
        { error: "This price just changed, so we haven't charged your card. Please reload and try again." },
        409,
      );
    }

    const payment = await createOneTimePayment(env, {
      sourceId: data.sourceId,
      amountMoney: item.priceMoney,
      buyerEmail: data.email,
      note: `${option.name} (${option.hours} hours)`,
    });
    if (payment.status !== "COMPLETED") {
      console.error(`[rangekey-checkout] payment ${payment.id} ended ${payment.status}`);
      await notifyStaff(env, {
        subject: `[ACTION NEEDED] RangeKey payment not completed: ${fullName}`,
        title: "RangeKey payment needs a look",
        intro: `${fullName} tried to buy ${option.name}. Square payment ${payment.id} ended as ${payment.status}. No account was created.`,
        fields: { name: fullName, email: data.email, item: option.name, paymentId: payment.id, status: payment.status },
        replyTo: data.email,
      });
      return json(
        { error: "We couldn't confirm your payment. Please call us at 626-879-5513 before trying again." },
        502,
      );
    }

    // Card is charged. From here on, nothing may fail the checkout.
    let provision: RangeKeyProvisionResult = { ok: false, error: "not attempted" };
    const args = {
      membershipPlanId: planId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      squarePaymentId: payment.id,
      squareVariationId: option.squareVariationId,
      amountCents: option.priceCents,
      paidAt: new Date().toISOString(),
      waiver: {
        waiverContentId: data.waiver.waiverContentId,
        openedAt: data.waiver.openedAt ?? null,
        scrollCompletedAt: data.waiver.scrollCompletedAt ?? null,
        acceptedAt: waiverAcceptedAt,
        ipAddress: ip,
        userAgent,
      },
    };
    for (let attempt = 0; attempt < 2 && !provision.ok; attempt++) {
      provision = await provisionRangeKey(env, args); // idempotent on squarePaymentId
    }
    if (!provision.ok) {
      console.error(`[rangekey-checkout] SwingRes handoff failed for payment ${payment.id}: ${provision.error}`);
    }

    try {
      await notifyStaff(env, {
        subject: provision.ok
          ? `[RANGEKEY] New purchase: ${fullName} · ${option.name}`
          : `[ACTION NEEDED] Paid RangeKey not created in SwingRes: ${fullName}`,
        title: provision.ok ? "New RangeKey purchase" : "Paid, but not in SwingRes yet",
        intro: provision.ok
          ? `${fullName} just bought ${option.name} (${option.hours} hours) through the website.`
          : `${fullName} was charged for ${option.name}, but SwingRes did not confirm the membership. Add them in SwingRes by hand (Customers > assign ${option.name}); Square payment ${payment.id}.`,
        fields: {
          name: fullName,
          email: data.email,
          phone: data.phone || "",
          item: option.name,
          hours: String(option.hours),
          paid: option.priceLabel,
          paymentId: payment.id,
          swingres: provision.ok
            ? provision.duplicate
              ? "already created (duplicate call)"
              : provision.inviteSent
                ? "membership created, login invite sent"
                : "membership created, login invite NOT sent (use Send invite)"
            : `FAILED: ${provision.error}`,
        },
        replyTo: data.email,
      });
    } catch {
      // best-effort
    }

    await sendConfirmation({
      env,
      to: data.email,
      ...rangeKeyConfirmation({
        firstName: data.firstName,
        optionName: option.name,
        hours: option.hours,
        priceLabel: option.priceLabel,
        provisioned: provision.ok,
        inviteSent: provision.ok && provision.inviteSent,
      }),
    });

    await logSubmission({
      env,
      formType: "membership-checkout",
      data: {
        name: fullName,
        email: data.email,
        phone: data.phone || "",
        message: `${option.name} (${option.hours}h), payment ${payment.id}, swingres=${provision.ok ? "ok" : "FAILED:" + provision.error}`,
        plan: option.slug,
        paymentId: payment.id,
      },
      ip,
      userAgent,
    });

    return json({ ok: true, provisioned: provision.ok });
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json({ error: "Something went wrong processing your payment. Please try again." }, 500);
  }
};

async function notifyStaff(
  env: RangeKeyEnv,
  a: { subject: string; title: string; intro: string; fields: Record<string, string>; replyTo: string },
) {
  await sendEmail({
    env,
    subject: a.subject,
    replyTo: a.replyTo,
    html: wrapBrandedEmail({ title: a.title, intro: a.intro, bodyHtml: renderKv(a.fields) }),
  });
}
