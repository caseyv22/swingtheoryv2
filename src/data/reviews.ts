// Real reviews pulled from Google, Yelp, ClassPass, and Golf Now.

export type ReviewSource = "Google" | "Yelp" | "ClassPass" | "Golf Now";

export type Review = {
  quote: string;
  source: ReviewSource;
  stars: 1 | 2 | 3 | 4 | 5;
};

export const reviews: Review[] = [
  {
    quote:
      "Clean, spacious, and fun! Great for practicing or to hang out with friends! Perfect location with parking structure nearby.",
    source: "Google",
    stars: 5,
  },
  {
    quote:
      "Had a great experience at Swing Theory today playing golf for a few hours with some friends! I thought it was really nice that they had a small putting green area with kids' play golf clubs so that kids could play & stay entertained while their parents utilized one of the bays.",
    source: "Yelp",
    stars: 5,
  },
  {
    quote:
      "Great facility! Went with my family and was able to practice and use the bays to analyze my swing. I will definitely be back!",
    source: "ClassPass",
    stars: 5,
  },
  {
    quote:
      "Swing theory is an excellent indoor golf simulation facility. The facility is spacious, comfortable and clean. The simulator technology is very accurate.",
    source: "Golf Now",
    stars: 5,
  },
];

// Platforms shown in the multi-platform ratings row on the homepage.
export const ratingPlatforms: { name: ReviewSource; url: string }[] = [
  { name: "Google", url: "https://www.google.com/maps/place/Swing+Theory+Indoor+Golf/" },
  { name: "Yelp", url: "https://www.yelp.com/biz/swing-theory-indoor-golf-pasadena" },
  { name: "ClassPass", url: "https://classpass.com/" },
  { name: "Golf Now", url: "https://www.golfnow.com/" },
];
