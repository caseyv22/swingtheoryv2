import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import Button from "@/components/Button";
import { programs } from "@/data/programs";

export default function Programs() {
  return (
    <>
      <SEO
        title="Golf Programs in Pasadena: Leagues, Juniors, Summer Series | Swing Theory"
        description="Indoor golf programs at Swing Theory in Old Town Pasadena: Swing Theory Golf League, Mini Mulligans junior program, and summer series for women and seniors."
        path="/programs"
      />

      <Hero
        kicker="Programs"
        title={
          <>
            Programs for every kind of <em className="not-italic text-gold">Pasadena golfer.</em>
          </>
        }
        sub="Weekly leagues, junior lessons, and seasonal series built around real coaching and real launch monitor data, all indoors, seven days a week."
        ctas={
          <>
            <Button to="/programs/league-night" variant="gold">
              League Night
            </Button>
            <Button to="/programs/mini-mulligans" variant="ghost">
              Mini Mulligans
            </Button>
          </>
        }
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07885-scaled.jpg"
      />

      <section className="py-24">
        <div className="wrap">
          <SectionHead kicker="Programs" title="What's running now." />
          <div className="grid gap-6 md:grid-cols-2">
            {programs.map((p) => (
              <Link
                key={p.slug}
                to={`/programs/${p.slug}`}
                className="reveal group block rounded-2xl overflow-hidden border border-line bg-paper hover:-translate-y-1 transition duration-300"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="p-6">
                  <span className="kicker">{p.kicker}</span>
                  <h3 className="font-disp text-2xl text-green-700 mt-2">
                    {p.name}
                  </h3>
                  <p className="text-muted mt-2">{p.shortDescription}</p>
                  <div className="mt-4 font-disp text-sm text-gold-dk uppercase tracking-[0.14em]">
                    Learn more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
