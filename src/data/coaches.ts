export type Coach = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  specialties: string[];
};

// Placeholder — swap real coaches, bios, and headshots before launch.
export const coaches: Coach[] = [
  {
    slug: "coach-placeholder",
    name: "Coach TBD",
    title: "Head Coach",
    bio: "Bio coming soon. Add a real coach entry here — specialties, teaching history, favorite drill.",
    photo:
      "https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg",
    specialties: ["Full swing", "Short game", "Club fittings"],
  },
];
