export type NavItem = { label: string; to: string; external?: boolean };

export const primaryNav: NavItem[] = [
  { label: "Simulators", to: "/simulators" },
  { label: "Lessons", to: "/lessons" },
  { label: "Memberships", to: "/memberships" },
  { label: "League", to: "/league" },
  { label: "Programs", to: "/programs" },
  { label: "Events", to: "/events" },
  { label: "Visit", to: "/visit" },
];

export const footerNav = {
  Explore: [
    { label: "Simulators", to: "/simulators" },
    { label: "Lessons", to: "/lessons" },
    { label: "Memberships", to: "/memberships" },
    { label: "League", to: "/league" },
    { label: "Programs", to: "/programs" },
    { label: "Events", to: "/events" },
  ] as NavItem[],
  Visit: [
    { label: "Location & Hours", to: "/visit" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
  ] as NavItem[],
  Book: [
    { label: "Book a bay", to: "/book" },
    { label: "Membership interest", to: "/memberships" },
    { label: "Plan an event", to: "/events" },
    { label: "Join a league", to: "/league" },
  ] as NavItem[],
};
