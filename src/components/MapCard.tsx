import { site } from "@/data/site-config";

const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=16&output=embed`;

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
