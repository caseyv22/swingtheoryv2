import type { MembershipPlan } from "../../src/data/memberships";
import type { Env } from "./db";

// The fee wording that goes into the agreement's {{MONTHLY_FEE}} / {{FIRST_MONTH_TERMS}}
// placeholders. Computed in one place, on the server, so the text a member reads on the checkout
// page, the text SwingRes stores in the signed record and what Square actually charges can't
// disagree.

export function promoIsActive(env: Env, plan: MembershipPlan): boolean {
  // A test plan-variation override replaces both the regular and the promo variation, so the
  // promo can't apply while it's set.
  if (planVariationOverride(env, plan)) return false;
  return env.MEMBERSHIP_PROMO_ENABLED === "true" && !!plan.squarePromoPlanVariationId;
}

/** Testing-only Square plan variation for Green Jacket Solo (see Env.SQUARE_SOLO_PLAN_VARIATION_ID). */
export function planVariationOverride(env: Env, plan: MembershipPlan): string | null {
  if (plan.slug !== "green-jacket-solo") return null;
  return env.SQUARE_SOLO_PLAN_VARIATION_ID?.trim() || null;
}

export function agreementTerms(env: Env, plan: MembershipPlan): { monthlyFee: string; firstMonthTerms: string } {
  const monthlyFee = plan.priceLabel;
  const firstMonthTerms =
    promoIsActive(env, plan) && plan.promoPriceLabel
      ? `Your first month is discounted to ${plan.promoPriceLabel} (50% off), after which the regular monthly fee of ${plan.priceLabel} applies.`
      : "";
  return { monthlyFee, firstMonthTerms };
}
