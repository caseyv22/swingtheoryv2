// Real Google reviews with attribution. Placeholder set — replace author names
// with the actual reviewer first names from Google Business Profile before launch
// (E-E-A-T signal; helps AI citation).

export type Review = {
  quote: string;
  author: string;
  source: "Google" | "Yelp";
  stars: 1 | 2 | 3 | 4 | 5;
};

export const reviews: Review[] = [
  {
    quote:
      "Huge bays, top of the line tech, clean and modern. Best thing to happen to Old Town in a while.",
    author: "Google review",
    source: "Google",
    stars: 5,
  },
  {
    quote:
      "High-end simulators with really wide bays. Clean, spacious, and easy parking.",
    author: "Google review",
    source: "Google",
    stars: 5,
  },
  {
    quote:
      "Everyone was super friendly and helpful with my swing. Highly recommend.",
    author: "Google review",
    source: "Google",
    stars: 5,
  },
];
