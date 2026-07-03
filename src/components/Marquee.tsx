type Props = { items: string[] };

// F&B intentionally not listed — no lounge / food / drinks selling.
export default function Marquee({ items }: Props) {
  const doubled = [...items, ...items];
  return (
    <div className="bg-green-900 text-[#cbc7b4] overflow-hidden border-y border-white/5">
      <div
        className="flex gap-14 py-4 whitespace-nowrap font-disp tracking-[0.18em] text-[13.5px] uppercase animate-marquee"
        style={{ willChange: "transform" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="opacity-75">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
