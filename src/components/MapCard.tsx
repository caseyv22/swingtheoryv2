import { site } from "@/data/site-config";

// Preferred: the Google Maps "Share → Embed a map" URL for our Business
// Profile, stored in site-config as `mapEmbedSrc`. That URL's `?pb=...`
// blob encodes the canonical business entity so Google renders the actual
// Business Profile card (photo, category, rating, hours) inside the
// iframe — no API key or billing required. Fallback below is the
// unofficial `maps?q=&output=embed` URL, which sometimes shows the card
// and sometimes just a pin.
const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

const mapSrc =
  site.mapEmbedSrc && site.mapEmbedSrc.length > 0
    ? site.mapEmbedSrc
    : `https://www.google.com/maps?q=${encodeURIComponent(`${site.name}, ${fullAddress}`)}&z=16&output=embed`;

export default function MapCard() {
  return (
    <div className="reveal rounded-2xl overflow-hidden min-h-[340px] relative">
      <iframe
        title="Map to Swing Theory Indoor Golf"
        src={mapSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
