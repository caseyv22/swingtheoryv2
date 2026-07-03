export type MembershipPlan = {
  slug: string;
  name: string;
  headline: string;
  priceLabel: string;
  priceSub?: string;
  featured?: boolean;
  perks: string[];
  ctaLabel: string;
  ctaTarget: "book" | "interest" | "league";
};

// Real pricing carried over from swingtheory.golf (Green Jacket tiers).
// Membership onboarding is manual — every CTA opens the interest form.
export const membershipPlans: MembershipPlan[] = [
  {
    slug: "casual",
    name: "Casual",
    headline: "Pay as you play",
    priceLabel: "Pay",
    priceSub: "/ as you go",
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
      "Priority booking windows",
      "Member pricing on extras",
    ],
    ctaLabel: "Request membership info",
    ctaTarget: "interest",
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
      "Priority booking + member pricing",
    ],
    ctaLabel: "Request membership info",
    ctaTarget: "interest",
  },
];
