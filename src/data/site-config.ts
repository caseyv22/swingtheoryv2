// Single source of truth for NAP + business metadata.
// Per CLAUDE.md §6: nothing hardcodes NAP anywhere else. Import from here.

export const site = {
  name: "Swing Theory Indoor Golf",
  shortName: "Swing Theory",
  legalName: "Swing Theory Indoor Golf",
  tagline:
    "Indoor golf and golf simulators in Old Town Pasadena, practice, play, and host events, seven days a week.",
  url: "https://swingtheory.golf",
  logos: {
    white: "https://swingtheory.golf/wp-content/uploads/2024/12/Swing-Theory-Website-White.png",
    green: "https://swingtheory.golf/wp-content/uploads/2024/12/Swing-Theory-Website-Green.png",
  },
  address: {
    street: "50 S De Lacey Ave #200",
    city: "Pasadena",
    region: "CA",
    postalCode: "91105",
    country: "US",
  },
  geo: {
    lat: 34.144755,
    lng: -118.151999,
  },
  phone: {
    display: "(626) 879-5513",
    tel: "+16268795513",
  },
  email: "info@swingtheory.golf",
  hours: {
    display: "Mon–Sat 10am–8pm · Sun 10am–7pm",
    // schema.org openingHoursSpecification format
    schema: [
      {
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "20:00",
      },
      {
        dayOfWeek: ["Sunday"],
        opens: "10:00",
        closes: "19:00",
      },
    ],
  },
  bookingUrl:
    "https://booking.registrygolf.com/?organizationId=639ff740-1b51-4959-99af-19ac2d069609",
  // Local intent — per CLAUDE.md §3 + user feedback, target the LA basin.
  areaServed: [
    "Pasadena",
    "South Pasadena",
    "San Marino",
    "Alhambra",
    "Arcadia",
    "Glendale",
    "Burbank",
    "Los Angeles",
  ],
  priceRange: "$$",
  socials: {
    instagram: "https://www.instagram.com/swingtheory.golf/",
    instagramHandle: "@swingtheory.golf",
    google:
      "https://www.google.com/maps/place/Swing+Theory+Indoor+Golf/",
    yelp: "https://www.yelp.com/biz/swing-theory-indoor-golf-pasadena",
    facebook: "",
  },
  rating: {
    // Update from GBP as needed.
    value: 5.0,
    count: 40,
  },
} as const;

// Convenience: mapsUrl for "Get directions"
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`,
)}`;

// Same-as array used by JSON-LD
export const sameAs = Object.values(site.socials).filter(Boolean);
