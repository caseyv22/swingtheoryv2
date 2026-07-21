import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import FAQAccordion from "@/components/FAQAccordion";
import CoachCard from "@/components/CoachCard";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { coaches as fallbackCoaches } from "@/data/coaches";
import { faqsFor } from "@/data/faqs";
import { serviceSchema, faqPageSchema } from "@/schema";
import { useApi } from "@/hooks/useApi";
import type { CoachRow } from "@/data/types";

// Adapter, old static coaches file uses different field names than the DB row.
type CoachDisplay = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  specialties: string[];
  phone?: string;
};
function adaptFallback(): CoachDisplay[] {
  return fallbackCoaches.map((c) => ({
    slug: c.slug,
    name: c.name,
    title: c.title,
    bio: c.bio,
    photo: c.photo,
    specialties: [...c.specialties],
    phone: c.phone,
  }));
}
function adaptRow(r: CoachRow): CoachDisplay {
  return {
    slug: r.slug,
    name: r.name,
    title: r.title,
    bio: r.bio,
    photo: r.photo_url,
    specialties: r.specialties,
    phone: r.phone,
  };
}

export default function Lessons() {
  const items = faqsFor("lessons");
  const { data } = useApi<CoachRow[]>("/api/public/coaches");
  const coachList: CoachDisplay[] =
    data && data.length > 0 ? data.map(adaptRow) : adaptFallback();
  return (
    <>
      <SEO
        title="Golf Lessons in Pasadena | Swing Theory Indoor Golf"
        description="Private golf lessons in Old Town Pasadena. Data-backed coaching with tour-grade launch monitors, slow-motion swing replay, and independent instructors for every level."
        path="/lessons"
        image={`${site.url}/images/home/home-lessons-og.jpg`}
      />
      <JsonLd
        data={[
          serviceSchema({
            name: "Golf lessons",
            description:
              "Private indoor golf lessons in Old Town Pasadena using tour-grade launch monitors and swing video. Independent instructors set their own rates; contact the coach directly for pricing.",
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
        sub="Private lessons with real launch monitor data on every swing. Beginner-friendly, and rigorous enough for low-handicappers dialing in tournament prep."
        ctas={
          <>
            <Button to="/contact" variant="gold">
              Contact a coach for rates
            </Button>
            <Button href={site.bookingUrl} external variant="ghost">
              Book a bay
            </Button>
          </>
        }
        poster="/images/home/home-lessons.webp"
      />

      <section className="py-24">
        <SplitBlock
          imageSrc="/images/lessons/uneekordata.webp"
          imageAlt="Golf coach at Swing Theory Pasadena"
        >
          <span className="kicker">How lessons work</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Data + feel, together.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Every lesson happens on a bay running a tour-grade Uneekor launch
            monitor with GSPro simulation and slow-motion video. You'll leave
            with numbers, a swing you can feel, and a specific practice plan,
            not just vibes.
          </p>
          <FeatList
            items={[
              "Full swing, short game, and putting",
              "Junior coaching (see the Mini Mulligans program)",
              "Single lessons and group programs",
            ]}
          />
          <p className="text-muted text-[1.08rem] mt-6">
            Coaches at Swing Theory are independent instructors and set their
            own rates. Reach out to a coach directly for pricing and
            availability.
          </p>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper">
        <div className="wrap">
          <SectionHead kicker="Coaches" title="Meet the team." />
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {coachList.map((c) => (
              <CoachCard key={c.slug} coach={c} />
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
