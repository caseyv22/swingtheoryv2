import { site } from "@/data/site-config";

// Search query is BUSINESS NAME + full address, not just the address. Google
// Maps matches the query against its Business Profile index and, when it
// finds an exact-name-plus-address match, renders the embedded map with the
// business card (photo, category, hours, aggregate rating + review count)
// instead of a bare address pin. This is what surfaces our 5-star rating
// inline on /visit. If Google ever fails to link it, worst case degrades
// to a plain pin at the same address, safe fallback.
const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
const mapQuery = `${site.name}, ${fullAddress}`;
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;

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
