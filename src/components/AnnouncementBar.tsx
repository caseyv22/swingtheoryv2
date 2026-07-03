export default function AnnouncementBar() {
  return (
    <div className="bg-green-900 text-[#e9e2cf] text-center font-disp text-[12.5px] tracking-[0.12em] uppercase py-2 px-4">
      Now open in Old Town Pasadena ·{" "}
      <a href="/book" className="text-gold hover:underline">
        Book a bay tonight →
      </a>
    </div>
  );
}
