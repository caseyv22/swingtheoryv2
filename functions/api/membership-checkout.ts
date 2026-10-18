import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, wrapBrandedEmail } from "../lib/email";
import { membershipConfirmation } from "../lib/confirmations";
import { logSubmission } from "../lib/submissions";
import { membershipCheckoutSchema } from "../../src/lib/validation";
import { signatureMatchesName } from "../../src/lib/agreement-signature";
import { membershipPlans } from "../../src/data/memberships";
import { findOrCreateCustomer, createCardOnFile, createSubscription, SquareApiError } from "../lib/square";
import { agreementTerms, planVariationOverride, promoIsActive } from "../lib/membership-agreement-terms";
import { createSignup, updateSignup } from "../lib/membership-signups";
import {
  agreementFlowPlanId,
  checkEligibility,
  fetchCurrentAgreement,
  provisionMembership,
  type ProvisionResult,
} from "../lib/swingres";
import type { Env } from "../lib/db";

// Paid membership signup. The Web Payments SDK on /memberships/checkout
// tokenizes the card in-browser and posts us the nonce (sourceId), the raw
// card number never touches this server. From there: find-or-create the
// Square customer, put the card on file, then create the subscription.
//
// Signed-agreement flow (Green Jacket Solo, only when SwingRes is configured, see
// agreementFlowPlanId): the order is agreement FIRST, payment LAST.
//   1. check the email isn't already an active member (SwingRes), BEFORE any charge
//   2. record the signature in D1 with a server-set timestamp (membership_signups)
//   3. Square: customer, card, subscription (the charge)
//   4. hand off to SwingRes: membership + signed PDF under the member's profile + login invite
// Steps 1-2 failing means nothing was charged. Step 4 failing never undoes the charge: the
// signup row is marked provision_failed and staff are emailed to add the member by hand.
// With the flow off, none of this runs and the handler is the same as it always was.
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
  const promoActive = promoIsActive(env, plan);
  // Testing only: SQUARE_SOLO_PLAN_VARIATION_ID points Solo at a different (e.g. sandbox) plan
  // variation. Its parent item is then looked up from the plan instead of using the production
  // item id in memberships.ts.
  const variationOverride = planVariationOverride(env, plan);
  const planVariationId =
    variationOverride ??
    (promoActive ? (plan.squarePromoPlanVariationId as string) : plan.squarePlanVariationId);
  const itemId = variationOverride ? undefined : plan.squareItemId;

  const ip = request.headers.get("cf-connecting-ip");
  const userAgent = request.headers.get("user-agent");

  // ── Signed-agreement gate (before anything touches the card) ────────────
  const swingresPlanId = agreementFlowPlanId(env, plan.slug);
  const terms = agreementTerms(env, plan);
  let signupId: string | null = null;
  let signedAt = "";
  if (swingresPlanId) {
    const agreement = data.agreement;
    if (!agreement) {
      return json(
        { error: "Please review and sign the membership agreement to continue. You haven't been charged." },
        400,
      );
    }
    if (!signatureMatchesName(agreement.typedSignature, data.firstName, data.lastName)) {
      return json(
        { error: "Your typed signature must match the first and last name above. You haven't been charged." },
        400,
      );
    }

    const eligibility = await checkEligibility(env, data.email);
    if (!eligibility.ok) {
      console.error(`[membership-checkout] eligibility check failed: ${eligibility.error}`);
      return json(
        {
          error:
            "We couldn't verify your membership status right now, so we haven't charged your card. Please try again in a few minutes, or call us at 626-879-5513.",
        },
        503,
      );
    }
    if (!eligibility.eligible) {
      return json(
        {
          error:
            "This email already has an active Swing Theory membership, so we haven't charged your card. If that's you, sign in at res.swingtheory.golf. Otherwise, call us at 626-879-5513 and we'll sort it out.",
        },
        409,
      );
    }

    const current = await fetchCurrentAgreement(env);
    if (!current) {
      return json(
        { error: "The membership agreement couldn't be loaded, so we haven't charged your card. Please try again in a moment." },
        503,
      );
    }
    if (current.id !== agreement.agreementContentId) {
      return json(
        {
          error:
            "The membership agreement was just updated. Please reload this page and review it again. You haven't been charged.",
        },
        409,
      );
    }

    // The signing time is OUR clock, set here, never taken from the browser.
    signedAt = new Date().toISOString();
    signupId = crypto.randomUUID();
    try {
      await createSignup(env, {
        id: signupId,
        planSlug: plan.slug,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        agreementContentId: agreement.agreementContentId,
        typedSignature: agreement.typedSignature,
        openedAt: agreement.openedAt ?? null,
        scrollCompletedAt: agreement.scrollCompletedAt ?? null,
        signedAt,
        ipAddress: ip,
        userAgent,
        monthlyFee: terms.monthlyFee,
        firstMonthTerms: terms.firstMonthTerms,
      });
    } catch (e) {
      // No record of the signature means no charge.
      console.error(`[membership-checkout] couldn't record signature: ${e instanceof Error ? e.message : String(e)}`);
      return json(
        { error: "Something went wrong, and your card has not been charged. Please try again, or call us at 626-879-5513." },
        500,
      );
    }
  }

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
    // isn't fully wired up in memberships.ts. (With a variation override
    // the helper finds the item from the plan itself.)
    if (!itemId && !variationOverride) {
      if (signupId) {
        await updateSignup(env, signupId, { status: "payment_failed", errorMessage: "plan has no squareItemId" });
      }
      return json({ error: "That plan isn't fully configured yet." }, 400);
    }
    const subscription = await createSubscription(env, {
      customerId,
      cardId,
      planVariationId,
      itemId,
    });

    // Hand off to SwingRes (agreement flow only). Never throws; a failure is recorded and staff
    // are told, but the member has paid and the checkout still succeeds.
    let provision: ProvisionResult | null = null;
    if (swingresPlanId && signupId && data.agreement) {
      await updateSignup(env, signupId, {
        status: "paid",
        squareSubscriptionId: subscription.id,
        squareSubscriptionStatus: subscription.status,
      });
      provision = await provisionMembership(env, {
        swingresPlanId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        squareSubscriptionId: subscription.id,
        squarePlanVariationId: planVariationId,
        agreement: {
          agreementContentId: data.agreement.agreementContentId,
          typedSignature: data.agreement.typedSignature,
          monthlyFee: terms.monthlyFee,
          firstMonthTerms: terms.firstMonthTerms,
          openedAt: data.agreement.openedAt ?? null,
          scrollCompletedAt: data.agreement.scrollCompletedAt ?? null,
          signedAt,
          ipAddress: ip,
          userAgent,
        },
      });
      if (provision.ok) {
        await updateSignup(env, signupId, {
          status: "provisioned",
          swingresCustomerId: provision.customerId,
          swingresSubscriptionId: provision.subscriptionId,
          swingresAgreementId: provision.agreementAcceptanceId,
        });
      } else {
        console.error(`[membership-checkout] SwingRes handoff failed for ${subscription.id}: ${provision.error}`);
        await updateSignup(env, signupId, { status: "provision_failed", errorMessage: provision.error });
      }
    }
    const pdfBase64 = provision?.ok ? provision.agreementPdfBase64 : null;
    const agreementFileName = `Swing-Theory-Membership-Agreement-${data.lastName}-${data.firstName}.pdf`
      .replace(/[^A-Za-z0-9._-]+/g, "");

    // Staff notification, best-effort. The subscription already succeeded
    // by this point, so an email hiccup shouldn't fail the checkout.
    try {
      const needsAction = !!provision && !provision.ok;
      await sendEmail({
        env,
        subject: needsAction
          ? `[ACTION NEEDED] Paid membership not created in SwingRes: ${data.firstName} ${data.lastName}`
          : `[MEMBERSHIP] New signup: ${data.firstName} ${data.lastName} · ${plan.name}`,
        replyTo: data.email,
        attachments: pdfBase64 ? [{ filename: agreementFileName, content: pdfBase64 }] : undefined,
        html: wrapBrandedEmail({
          title: needsAction ? "Paid, but not in SwingRes yet" : "New paid membership",
          intro: needsAction
            ? `${data.firstName} ${data.lastName} subscribed to ${plan.name} and was charged, and signed the membership agreement, but SwingRes did not confirm the membership. Add them in SwingRes by hand (Customers > assign ${plan.name}); their signature is saved in the website's membership_signups table.`
            : `${data.firstName} ${data.lastName} just subscribed to ${plan.name} through the website checkout.`,
          bodyHtml: renderKv({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone || "",
            plan: plan.name,
            price: `${plan.priceLabel}${plan.priceSub ?? ""}`,
            promo: promoActive ? "50% first month promo applied" : "",
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            agreement: provision
              ? provision.ok
                ? pdfBase64
                  ? "signed, copy attached, saved under the customer in SwingRes"
                  : "signed, saved in SwingRes (PDF will render on first download)"
                : "signed, NOT saved in SwingRes yet"
              : "",
            swingres: provision
              ? provision.ok
                ? provision.inviteSent
                  ? "membership created, login invite sent"
                  : "membership created, login invite NOT sent (use Send invite)"
                : `FAILED: ${provision.error}`
              : "",
            signupRecord: signupId ?? "",
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
        signedAgreementAttached: !!pdfBase64,
      }),
      attachments: pdfBase64 ? [{ filename: agreementFileName, content: pdfBase64 }] : undefined,
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
      userAgent,
    });

    return json({ ok: true, subscriptionId: subscription.id, status: subscription.status });
  } catch (e) {
    if (signupId) {
      await updateSignup(env, signupId, {
        status: "payment_failed",
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json(
      { error: "Something went wrong processing your membership. Please try again." },
      500,
    );
  }
};
