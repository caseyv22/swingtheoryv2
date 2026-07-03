import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import FAQAccordion from "@/components/FAQAccordion";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { coaches } from "@/data/coaches";
import { faqsFor } from "@/data/faqs";
import { serviceSchema, faqPageSchema } from "@/schema";

export default function Lessons() {
  const items = faqsFor("lessons");
  return (
    <>
      <SEO
        title="Golf Lessons in Pasadena | Swing Theory Indoor Golf"
        description="Private golf lessons and club fittings in Old Town Pasadena. Data-backed coaching with tour-grade launch monitors, slow-motion swing replay, and coaches for every level."
        path="/lessons"
      />
      <JsonLd
        data={[
          serviceSchema({
            name: "Golf lessons and club fittings",
            description:
              "Private indoor golf lessons and club fittings in Old Town Pasadena using tour-grade launch monitors and swing video.",
            url: `${site.url}/lessons`,
            serviceType: "Golf instruction",
          }),
          faqPageSchema(items),
        ]}
      />

      <Hero
        kicker="Golf Lessons · Pasadena"
        title={
          <>
            Golf lessons in <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Private lessons and club fittings with real launch monitor data on every swing. Beginner-friendly, and rigorous enough for low-handicappers dialing in tournament prep."
        ctas={
          <>
            <Button href={site.bookingUrl} external variant="gold">
              Book a lesson
            </Button>
            <Button to="/contact" variant="ghost">
              Ask a coach
            </Button>
          </>
        }
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg"
      />

      <section className="py-24">
        <SplitBlock
          imageSrc="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg"
          imageAlt="Golf coach at Swing Theory Pasadena"
        >
          <span className="kicker">How lessons work</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Data + feel, together.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Every lesson happens on a bay running a tour-grade launch monitor
            and slow-motion video. You'll leave with numbers, a swing you can
            feel, and a specific practice plan — not just vibes.
          </p>
          <FeatList
            items={[
              "Full swing, short game, and putting",
              "Club fittings with real ball-flight data",
              "Junior coaching (see the Mini Mulligans program)",
              "Single lessons and multi-lesson packages",
            ]}
          />
          <Button href={site.bookingUrl} external variant="dk">
            Book a lesson
          </Button>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper">
        <div className="wrap">
          <SectionHead kicker="Coaches" title="Meet the team." />
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {coaches.map((c) => (
              <div key={c.slug} className="reveal bg-cream border border-line rounded-2xl overflow-hidden">
                <img src={c.photo} alt={c.name} className="w-full aspect-square object-cover" loading="lazy" />
                <div className="p-6">
                  <div className="font-disp text-xl text-green-700">{c.name}</div>
                  <div className="font-disp text-xs uppercase tracking-[0.14em] text-muted mt-1">
                    {c.title}
                  </div>
                  <p className="text-[0.98rem] text-ink mt-3">{c.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.specialties.map((s) => (
                      <span key={s} className="text-xs bg-green-700/10 text-green-700 rounded-full px-3 py-1 font-disp">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap">
          <SectionHead align="center" kicker="Good to Know" title="Lesson FAQ." />
          <FAQAccordion items={items} />
        </div>
      </section>
    </>
  );
}
