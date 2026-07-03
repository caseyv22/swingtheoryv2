type Stat = { n: string; l: string };

export default function StatBand({ stats }: { stats: Stat[] }) {
  return (
    <div className="bg-green-700 text-white py-16">
      <div className="wrap grid gap-8 text-center" style={{
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      }}>
        {stats.map((s, i) => (
          <div key={i} className="reveal">
            <div className="font-disp font-extrabold text-gold leading-none text-[clamp(2.4rem,4vw,3.4rem)]">
              {s.n}
            </div>
            <div className="font-disp uppercase tracking-[0.14em] text-[12.5px] text-[#d7e2da] mt-2">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
