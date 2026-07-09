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
  // Currently a SANDBOX id; swap to the production plan variation id
  // before launch (see functions/lib/db.ts SQUARE_ENV).
  squarePlanVariationId?: string;
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
      "Bring up to 6 players per bay",
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
    ctaLabel: "Request membership info",
    ctaTarget: "interest",
  },
];
