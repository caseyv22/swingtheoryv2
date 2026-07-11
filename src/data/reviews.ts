// Real reviews pulled from Google, Yelp, ClassPass, and Golf Now.

export type ReviewSource = "Google" | "Yelp" | "ClassPass" | "Golf Now";

export type Review = {
  quote: string;
  source: ReviewSource;
  stars: 1 | 2 | 3 | 4 | 5;
  url: string;
};

// Canonical review-source URLs. Also referenced by ratingPlatforms below so
// the platform badges and individual review cards point to the same place.
// Google URL uses the CID (Google Business Profile customer id) form —
// the officially-supported canonical for a specific business listing,
// stripped of session/tracking params. CID was extracted from the `lrd=`
// fragment of the original share URL (0x6c2bbc2725967fad in decimal).
export const reviewSourceUrls: Record<ReviewSource, string> = {
  Google: "https://www.google.com/maps?cid=7794530456415141805",
  Yelp: "https://www.yelp.com/biz/swing-theory-indoor-golf-pasadena",
  ClassPass: "https://classpass.com/studios/swing-theory-pasadena",
  "Golf Now": "https://www.golfnow.com/tee-times/facility/19920-swing-theory/",
};

export const reviews: Review[] = [
  {
    quote:
      "Clean, spacious, and fun! Great for practicing or to hang out with friends! Perfect location with parking structure nearby.",
    source: "Google",
    stars: 5,
    url: reviewSourceUrls.Google,
  },
  {
    quote:
      "Had a great experience at Swing Theory today playing golf for a few hours with some friends! I thought it was really nice that they had a small putting green area with kids' play golf clubs so that kids could play & stay entertained while their parents utilized one of the bays.",
    source: "Yelp",
    stars: 5,
    url: reviewSourceUrls.Yelp,
  },
  {
    quote:
      "Great facility! Went with my family and was able to practice and use the bays to analyze my swing. I will definitely be back!",
    source: "ClassPass",
    stars: 5,
    url: reviewSourceUrls.ClassPass,
  },
  {
    quote:
      "Swing theory is an excellent indoor golf simulation facility. The facility is spacious, comfortable and clean. The simulator technology is very accurate.",
    source: "Golf Now",
    stars: 5,
    url: reviewSourceUrls["Golf Now"],
  },
];

// Platforms shown in the multi-platform ratings row on the homepage. Same
// URLs the individual review cards use, so the badges are clickable and go
// somewhere useful instead of platform homepages.
export const ratingPlatforms: { name: ReviewSource; url: string }[] = [
  { name: "Google", url: reviewSourceUrls.Google },
  { name: "Yelp", url: reviewSourceUrls.Yelp },
  { name: "ClassPass", url: reviewSourceUrls.ClassPass },
  { name: "Golf Now", url: reviewSourceUrls["Golf Now"] },
];
