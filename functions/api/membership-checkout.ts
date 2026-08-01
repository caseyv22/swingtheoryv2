import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, wrapBrandedEmail } from "../lib/email";
import { membershipConfirmation } from "../lib/confirmations";
import { logSubmission } from "../lib/submissions";
import { membershipCheckoutSchema } from "../../src/lib/validation";
import { membershipPlans } from "../../src/data/memberships";
import { findOrCreateCustomer, createCardOnFile, createSubscription, SquareApiError } from "../lib/square";
import type { Env } from "../lib/db";

// Paid membership signup. The Web Payments SDK on /memberships/checkout
// tokenizes the card in-browser and posts us the nonce (sourceId), the raw
// card number never touches this server. From there: find-or-create the
// Square customer, put the card on file, then create the subscription.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = membershipCheckoutSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries and try again." }, 400);
  const data = parsed.data;

  // Server-side allowlist, never trust a client-supplied plan variation id
  // or price. The slug has to match a plan we've actually wired up here.
  const plan = membershipPlans.find((p) => p.slug === data.planSlug);
  if (!plan?.squarePlanVariationId) {
    return json({ error: "That plan isn't available for checkout yet." }, 400);
  }

  // Promo swap: when MEMBERSHIP_PROMO_ENABLED is "true" AND this plan has a
  // squarePromoPlanVariationId configured, subscribe against the promo
  // variation instead of the regular one. The promo variation is set up in
  // Square with a STATIC first-month phase followed by RELATIVE ongoing
  // phases, so Square itself charges 50% for cycle 1 then switches to full
  // price on cycle 2 — no billing logic in this handler.
  const promoActive =
    env.MEMBERSHIP_PROMO_ENABLED === "true" && !!plan.squarePromoPlanVariationId;
  const planVariationId = promoActive
    ? (plan.squarePromoPlanVariationId as string)
    : plan.squarePlanVariationId;

  const ip = request.headers.get("cf-connecting-ip");

  try {
    const customerId = await findOrCreateCustomer(env, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
    });

    const cardId = await createCardOnFile(env, {
      customerId,
      sourceId: data.sourceId,
      cardholderName: `${data.firstName} ${data.lastName}`.trim(),
    });

    // itemId is required by createSubscription now — it's used to build
    // the order template Square needs on RELATIVE-priced phases. Fail
    // fast here (not deep in the Square helper) if the membership plan
    // isn't fully wired up in memberships.ts.
    if (!plan.squareItemId) {
      return json({ error: "That plan isn't fully configured yet." }, 400);
    }
    const subscription = await createSubscription(env, {
      customerId,
      cardId,
      planVariationId,
      itemId: plan.squareItemId,
    });

    // Staff notification, best-effort. The subscription already succeeded
    // by this point, so an email hiccup shouldn't fail the checkout.
    try {
      await sendEmail({
        env,
        subject: `[MEMBERSHIP] New signup: ${data.firstName} ${data.lastName} · ${plan.name}`,
        replyTo: data.email,
        html: wrapBrandedEmail({
          title: "New paid membership",
          intro: `${data.firstName} ${data.lastName} just subscribed to ${plan.name} through the website checkout.`,
          bodyHtml: renderKv({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone || "",
            plan: plan.name,
            price: `${plan.priceLabel}${plan.priceSub ?? ""}`,
            promo: promoActive ? "50% first month promo applied" : "",
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
          }),
        }),
      });
    } catch {
      // swallow, see comment above
    }

    // New member's welcome email. This is the only thing the member gets
    // from us — Square sends a payment receipt, but that's a transaction
    // record, not a welcome. Best-effort: the subscription is already live
    // and the card already charged, so a send failure must not fail the
    // checkout.
    //
    // Perks come off the plan row so this email and the pricing card can
    // never drift. isGroup drives the second-member block, which is the
    // only place in the product that explains how to activate the second
    // half of a Group plan — Square bills it as one subscription against
    // one card and has no concept of the second person.
    await sendConfirmation({
      env,
      to: data.email,
      ...membershipConfirmation({
        firstName: data.firstName,
        planName: plan.name,
        priceLabel: `${plan.priceLabel}${plan.priceSub ?? ""}`,
        perks: plan.perks,
        isGroup: plan.slug === "green-jacket-group",
      }),
    });

    await logSubmission({
      env,
      formType: "membership-checkout",
      data: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone || "",
        message: `${plan.name}, subscription ${subscription.id} (${subscription.status})`,
        plan: plan.slug,
        subscriptionId: subscription.id,
      },
      ip,
      userAgent: request.headers.get("user-agent"),
    });

    return json({ ok: true, subscriptionId: subscription.id, status: subscription.status });
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json(
      { error: "Something went wrong processing your membership. Please try again." },
      500,
    );
  }
};
