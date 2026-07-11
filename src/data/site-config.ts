// Single source of truth for NAP + business metadata.
// Per CLAUDE.md §6: nothing hardcodes NAP anywhere else. Import from here.

export const site = {
  name: "Swing Theory Indoor Golf",
  shortName: "Swing Theory",
  legalName: "Swing Theory Indoor Golf",
  tagline:
    "Indoor golf and golf simulators in Old Town Pasadena, practice, play, and host events, seven days a week.",
  url: "https://swingtheory.golf",
  // Real hosted URL for schema's `logo` field (JSON-LD needs an absolute
  // image URL, not the inline currentColor <Logo> SVG used on-page).
  logos: {
    white: "https://swingtheory.golf/logo.png",
    green: "https://swingtheory.golf/logo.png",
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
  // Google Maps "Share → Embed a map" URL for the Swing Theory Business
  // Profile. The `?pb=...` blob encodes the canonical place entity so
  // Google renders the actual business card (photo, rating, hours) inside
  // the iframe — no API key or billing needed. Grab it from Google Maps:
  // search the business, click Share, click "Embed a map", copy the src
  // attribute of the iframe. Empty string falls back to a search-URL pin.
  mapEmbedSrc: "",
  // Local intent, per CLAUDE.md §3 + user feedback, target the LA basin.
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
    // Canonical Google Business Profile URL via CID (customer id). Cleaner
    // than a maps/place/ search URL and unambiguous for JSON-LD sameAs
    // entity disambiguation. CID derived from the lrd= fragment on the
    // Google reviews share URL.
    google: "https://www.google.com/maps?cid=7794530456415141805",
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
