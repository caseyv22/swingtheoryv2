import { site } from "@/data/site-config";

export default function MapCard() {
  return (
    <div
      className="reveal rounded-2xl overflow-hidden min-h-[340px] relative"
      style={{
        background:
          "url('https://swingtheory.golf/wp-content/uploads/2025/06/DSC07806-1024x683.jpg') center/cover",
      }}
      aria-label="Map to Swing Theory"
    >
      <span className="absolute left-5 bottom-5 bg-gold text-[#241c05] font-disp font-semibold text-[13px] tracking-[0.05em] px-4 py-2 rounded-full">
        {site.address.street}
      </span>
    </div>
  );
}
