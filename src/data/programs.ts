export type Program = {
  slug: string;
  name: string;
  h1: string;
  kicker: string;
  shortDescription: string;
  longDescription: string;
  audience: string;
  season?: string;
  keyDetails: string[];
  ctaLabel: string;
  image: string;
  dateRange?: string; // e.g. "Monday-Thursday" or "Tuesday and Thursday"
  timeRange?: string; // e.g. "6:00 PM - 8:00 PM"
  price?: string; // free text, e.g. "$239/month" or "$25 per session"
  startsOn?: string; // ISO date (YYYY-MM-DD)
};

// Programs are the recurring, formatted offerings — distinct from
// one-off events or standard lessons. Each gets its own route + schema.
export const programs: Program[] = [
  {
    slug: "league-night",
    name: "League Night",
    h1: "Indoor golf league in Pasadena",
    kicker: "Swing Theory Golf League",
    shortDescription:
      "A weekly indoor golf league at Swing Theory in Old Town Pasadena, matches, standings, and a season championship.",
    longDescription:
      "The Swing Theory Golf League (STGL) is our weekly indoor league. Teams play head-to-head matches on the simulators across a full season, with live standings, playoffs, and a year-end champion. Open to golfers of any level, handicaps are used to keep matches close.",
    audience: "All levels. Individuals and teams welcome.",
    season: "Runs seasonally. Sign up below to be notified of the next league start.",
    keyDetails: [
      "Weekly evening matches on tour-grade simulators",
      "Format: match play with handicaps",
      "Live standings and playoff bracket",
      "Season prizes and a green jacket",
      "Open to individuals, we help place free agents on teams",
    ],
    ctaLabel: "Sign up for League Night",
    image:
      "https://swingtheory.golf/wp-content/uploads/2025/06/DSC07885-scaled.jpg",
  },
  {
    slug: "mini-mulligans",
    name: "Mini Mulligans",
    h1: "Junior golf lessons in Pasadena: Mini Mulligans",
    kicker: "Junior program",
    shortDescription:
      "Junior golf lessons and clinics for kids in Pasadena, indoor bays, real coaches, and a low-pressure way to get started.",
    longDescription:
      "Mini Mulligans is our junior program for kids learning to play golf. Small-group indoor lessons on the simulators give junior golfers real launch monitor data and instant swing feedback, in a fun, low-pressure environment. All equipment provided.",
    audience: "Kids ages 6–14. All experience levels.",
    season: "Sessions run year-round; seasonal camps in summer and winter.",
    keyDetails: [
      "Small-group indoor coaching",
      "All clubs provided (right and left-handed)",
      "Real launch monitor data on every swing",
      "Focus on fundamentals, fitness, and fun",
      "Weekly sessions plus seasonal camps",
    ],
    ctaLabel: "Request Mini Mulligans info",
    image:
      "https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg",
  },
  {
    slug: "summer-womens",
    name: "Summer Women's Program",
    h1: "Women's golf program in Pasadena, Summer series",
    kicker: "Summer series · Women's",
    shortDescription:
      "A summer indoor golf program for women in Pasadena, group lessons, on-course prep, and a supportive community.",
    longDescription:
      "Our summer women's program pairs indoor group lessons with practice sessions and social play. Designed for beginners through intermediate players who want to build a real swing, meet other women who play, and take that game onto the course.",
    audience: "Women, all skill levels, beginners welcome.",
    season: "Runs June through August.",
    keyDetails: [
      "Weekly group lessons with a dedicated coach",
      "Indoor practice sessions on tour-grade simulators",
      "On-course prep for real-world rounds",
      "Community events and socials",
      "All equipment provided",
    ],
    ctaLabel: "Request women's program info",
    image:
      "https://swingtheory.golf/wp-content/uploads/2025/06/DSC07877-1024x683.jpg",
  },
  {
    slug: "summer-seniors",
    name: "Summer Seniors Program",
    h1: "Seniors golf program in Pasadena, Summer series",
    kicker: "Summer series · Seniors",
    shortDescription:
      "A summer indoor golf program for seniors in Pasadena, group lessons, low-impact practice, and community rounds.",
    longDescription:
      "The senior summer program is built for players 55+ who want to keep the game sharp without the heat, the walking, or the wait. Indoor lessons, comfortable bays, and a friendly group of regulars.",
    audience: "Golfers 55+ of any skill level.",
    season: "Runs June through August.",
    keyDetails: [
      "Weekly group lessons with a dedicated coach",
      "Low-impact indoor practice, no walking, no heat",
      "Focus on rhythm, contact, and course management",
      "Community rounds and socials",
      "All equipment provided",
    ],
    ctaLabel: "Request seniors program info",
    image:
      "https://swingtheory.golf/wp-content/uploads/2025/06/DSC07806-1024x683.jpg",
  },
];

export function findProgram(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}
