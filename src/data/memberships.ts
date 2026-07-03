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

// Placeholder tiers — swap final pricing/perks in one place.
// Booking uses registrygolf.com deep link; membership + league use interest forms.
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
    slug: "founder",
    name: "Founder",
    headline: "For regulars",
    priceLabel: "6 hrs",
    priceSub: "/ month",
    featured: true,
    perks: [
      "6 bay hours every month",
      "Priority booking windows",
      "Member pricing on extra time",
      "Guest and event discounts",
      "Founding-member perks",
    ],
    ctaLabel: "Request membership info",
    ctaTarget: "interest",
  },
  {
    slug: "league",
    name: "League",
    headline: "Play weekly",
    priceLabel: "Weekly",
    priceSub: "/ league play",
    perks: [
      "Swing Theory Golf League",
      "Weekly matches and standings",
      "Community events",
      "Season prizes",
    ],
    ctaLabel: "Join the league",
    ctaTarget: "league",
  },
];
