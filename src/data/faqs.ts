// FAQ pairs. Rendered on /faq AND fed to FAQPage JSON-LD.
// CRITICAL: JSON-LD answer text MUST match visible answer text verbatim.
// Direct, factual answers — no promotional language ("premier," "best," etc.)
// per CLAUDE.md §3.

export type FAQ = {
  q: string;
  a: string;
  // Which pages should include this FAQ in their FAQPage schema.
  categories: Array<"home" | "general" | "simulators" | "lessons" | "events" | "visit">;
};

export const faqs: FAQ[] = [
  {
    q: "How much does it cost to play at Swing Theory?",
    a: "Simulator bays are booked by the hour and hold up to 6 players, so groups can split the cost. Members get discounted rates and monthly included hours. Live pricing and availability are shown when you book online.",
    categories: ["home", "general", "simulators"],
  },
  {
    q: "Do I need my own clubs?",
    a: "No. Swing Theory has rental clubs for right and left-handed players, so you can show up empty-handed. Bring your own set if you'd rather dial in your own gamers.",
    categories: ["home", "general", "simulators"],
  },
  {
    q: "Is Swing Theory good for beginners?",
    a: "Yes. The simulators make it easy to learn — you see real launch monitor data on every swing and the staff is happy to walk first-timers through the setup. It works equally well for low-handicap players.",
    categories: ["home", "general", "lessons"],
  },
  {
    q: "Can I book a party or corporate event?",
    a: "Yes. Swing Theory hosts birthdays, corporate team nights, and private buyouts. Fill out the events inquiry form and we will send options for group size, bay count, and timing.",
    categories: ["home", "general", "events"],
  },
  {
    q: "Where is Swing Theory located?",
    a: "50 S De Lacey Ave #200, in the heart of Old Town Pasadena. The studio is walkable from most of Old Town with nearby garage parking. Open Monday through Saturday 10am–8pm and Sunday 10am–7pm.",
    categories: ["home", "general", "visit"],
  },
  {
    q: "What launch monitors do you use?",
    a: "Every bay runs a tour-grade launch monitor that tracks ball speed, spin, launch angle, carry distance, and club-face data on every shot, with slow-motion swing and impact replay.",
    categories: ["simulators", "lessons"],
  },
  {
    q: "How many bays are there?",
    a: "Swing Theory has four wide simulator bays, including a private suite for events and group play.",
    categories: ["simulators", "events"],
  },
  {
    q: "Do you offer lessons?",
    a: "Yes. Private lessons and club fittings are available with our coaches. Every session uses launch monitor data and video replay so you leave with real feedback, not just feel.",
    categories: ["lessons", "general"],
  },
  {
    q: "Do you serve food or drinks?",
    a: "Swing Theory is a golf studio — we do not sell food or drinks. Guests are welcome to bring their own food and beverages into the bay during their booking.",
    categories: ["home", "general", "visit"],
  },
  {
    q: "How does membership work?",
    a: "Membership onboarding is handled personally. Submit the membership interest form and a team member will follow up with plans, pricing, and next steps.",
    categories: ["general"],
  },
];

export function faqsFor(page: FAQ["categories"][number]) {
  return faqs.filter((f) => f.categories.includes(page));
}
