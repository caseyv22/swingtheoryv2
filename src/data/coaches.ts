export type Coach = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  specialties: string[];
  phone?: string;
};

// Placeholder — swap real coaches, bios, and headshots before launch.
export const coaches: Coach[] = [
  {
    slug: "coach-placeholder",
    name: "Coach TBD",
    title: "Head Coach",
    bio: "Bio coming soon. Add a real coach entry here: specialties, teaching history, favorite drill.",
    photo: "/images/home/home-lessons.webp",
    specialties: ["Full swing", "Short game", "Club fittings"],
  },
];
