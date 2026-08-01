export type MembershipPlan = {
  slug: string;
  name: string;
  headline: string;
  priceLabel: string;
  priceSub?: string;
  featured?: boolean;
  perks: string[];
  ctaLabel: string;
  ctaTarget: "book" | "interest" | "league" | "checkout";
  // Square subscription plan variation ID for plans that go through the
  // direct-checkout flow (/memberships/checkout). Only set this once the
  // plan variation actually exists in the target Square environment ,
  // functions/api/membership-checkout.ts refuses to run without it.
  squarePlanVariationId?: string;
  // Square catalog item id (parent ITEM of the subscription plan). Used by
  // /api/membership-description to pull the plan's live description from
  // Square dashboard for the checkout Order Summary. Only needed for plans
  // that use the checkout flow AND want the dynamic description; without
  // it the checkout falls back to `headline` below.
  squareItemId?: string;
  // Optional second plan variation on the same subscription plan that
  // charges 50% for the first billing cycle then rolls to full price on
  // cycle 2 (STATIC phase 0 for 1 period, RELATIVE phase 1 indefinitely).
  // Only used when the MEMBERSHIP_PROMO_ENABLED toggle is on server-side
  // AND VITE_MEMBERSHIP_PROMO_ENABLED is on client-side. See
  // functions/api/membership-checkout.ts for the swap and PlanCard.tsx for
  // the promo price copy. Leaving this unset means the plan never runs the
  // promo, even when the flag flips on.
  squarePromoPlanVariationId?: string;
  // Optional pre-formatted price copy shown on the PlanCard when the promo
  // flag is active and squarePromoPlanVariationId is set. Kept in the data
  // layer so we can tweak the marketing line without touching component
  // code. Example: "$119.50 first month" (headline) + "then $239 / month"
  // (subline).
  promoPriceLabel?: string;
  promoPriceSub?: string;
};

// Real pricing carried over from swingtheory.golf (Green Jacket tiers).
// Plans with a squarePlanVariationId go straight to Square checkout;
// everything else still opens the human-follow-up interest form.
export const membershipPlans: MembershipPlan[] = [
  {
    slug: "hourly",
    name: "Hourly",
    headline: "Book individual bays",
    priceLabel: "$40 - $70",
    priceSub: "/ per hour",
    perks: [
      "Book any open bay",
      "Online reservations",
      "No commitment",
    ],
    ctaLabel: "Book a bay",
    ctaTarget: "book",
  },
  {
    slug: "green-jacket-solo",
    name: "Green Jacket Solo",
    headline: "Individual membership",
    priceLabel: "$239",
    priceSub: "/ month",
    featured: true,
    perks: [
      "Unlimited days at Swing Theory",
      "1 hour per day of bay time",
      "Bring up to 3 guests",
      "Exclusive Member Hours",
      "Merchandise discounts",
    ],
    ctaLabel: "Become a member",
    ctaTarget: "checkout",
    // Production: "Green Jacket 2026" subscription plan variation. Pricing
    // is RELATIVE, it pulls $239/mo from the linked "Green Jacket 2026"
    // item, so any future price change happens in Square dashboard, no
    // deploy needed. Previous sandbox id was MTVNYCWUXFC2I5DL4AM4HFZM.
    squarePlanVariationId: "FLGWJC4WPDD753IGVONJNELW",
    // Parent Square catalog item id, the "Green Jacket 2026" ITEM that the
    // subscription plan's RELATIVE pricing pulls from. Used by
    // functions/api/membership-description.ts so /memberships/checkout can
    // show the live Square item description in the Order Summary. Update
    // the description in Square Dashboard and it flows through on the next
    // edge-cache expiry (5 min), no deploy needed.
    squareItemId: "WX6XGBEN63XQSJAWCUREYR3U",
    // Second variation on the same "Green Jacket 2026" plan with a STATIC
    // $119.50 phase 0 (1 period) and RELATIVE phase 1 ongoing. Empty string
    // would keep the promo path dark even when MEMBERSHIP_PROMO_ENABLED
    // flips on. Created via Square API on 2026-07-11.
    squarePromoPlanVariationId: "5YDAAG36S4O2GWUJ7HTGPGWM",
    promoPriceLabel: "$119.50",
    promoPriceSub: " first month, then $239 / month",
  },
  {
    slug: "green-jacket-group",
    name: "Green Jacket Group",
    headline: "Two-member household or partner plan",
    priceLabel: "$349",
    priceSub: "/ month",
    perks: [
      "Two Green Jacket memberships",
      "Unlimited days for both members",
      "1 hour per day of bay time each",
      "Bring up to 3 guests per member",
      "Exclusive Member Hours",
      "Merchandise discounts",
    ],
    ctaLabel: "Become a member",
    ctaTarget: "checkout",
    // Production: "Green Jacket Group" subscription plan variation, created
    // 2026-08-01. Same shape as Solo above — a single MONTHLY phase with
    // RELATIVE pricing that pulls $349/mo from the linked "Green Jacket
    // Group 2026" item, so a price change is a Square Dashboard edit on the
    // item variation, no deploy needed.
    squarePlanVariationId: "53TFSVLHTPC5MU4W5VIZASDM",
    // Parent Square catalog item id. Powers the live Order Summary
    // description via functions/api/membership-description.ts, same as Solo.
    squareItemId: "34WV3C3DW5T6UPHEJXTOC7YO",
    // No squarePromoPlanVariationId on purpose — the 50%-first-month promo
    // is Solo-only. Leaving this unset means flipping
    // MEMBERSHIP_PROMO_ENABLED on can never discount this plan.
    //
    // Billing note: Square charges this as ONE subscription against one
    // customer + one card. The plan has no concept of the second member;
    // granting that person access is handled outside Square.
  },
];
