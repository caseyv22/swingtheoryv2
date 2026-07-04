import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import FAQAccordion from "@/components/FAQAccordion";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { faqsFor } from "@/data/faqs";
import { serviceSchema, faqPageSchema } from "@/schema";

export default function Simulators() {
  const items = faqsFor("simulators");
  return (
    <>
      <SEO
        title="Golf Simulator Rental in Pasadena | Swing Theory Indoor Golf"
        description="Rent a golf simulator bay in Old Town Pasadena. Four wide bays running Uneekor launch monitors and GSPro simulation, 100+ world courses, up to 6 players per bay. Open 7 days a week."
        path="/simulators"
      />
      <JsonLd
        data={[
          serviceSchema({
            name: "Golf simulator rental",
            description:
              "Hourly indoor golf simulator rental in Old Town Pasadena with tour-grade launch monitors and 100+ world courses.",
            url: `${site.url}/simulators`,
            serviceType: "Golf simulator rental",
          }),
          faqPageSchema(items),
        ]}
      />

      <Hero
        kicker="Golf Simulator Rental · Pasadena"
        title={
          <>
            Golf simulators in <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Four wide simulator bays, tour-grade launch monitors, 100+ world courses. Bays hold up to 6 players and book by the hour: practice, group play, or a serious range session."
        ctas={
          <>
            <Button href={site.bookingUrl} external variant="gold">
              Book a bay
            </Button>
            <Button to="/memberships" variant="ghost">
              See memberships
            </Button>
          </>
        }
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07885-scaled.jpg"
      />

      <section className="py-24">
        <SplitBlock
          imageSrc="https://swingtheory.golf/wp-content/uploads/2024/12/HOME-GOLF-SIM.jpg"
          imageAlt="Swing Theory golf simulator screen with launch monitor data"
        >
          <span className="kicker">Every bay</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Real numbers on every shot.
          </h2>
          <p className="text-muted text-[1.08rem]">
            The bays run tour-grade Uneekor launch monitors and GSPro
            simulation, the same class of tech used on Tour. That means ball
            speed, spin, launch angle, carry, and club-face data on every
            swing, plus slow-motion video replay.
          </p>
          <FeatList
            items={[
              "Ball speed, spin, launch, carry, and club-face data",
              "Slow-motion swing and impact replay",
              "100+ playable world courses",
              "Virtual driving range and skills games",
              "Right and left-handed rental clubs available",
              "Up to 6 players per bay",
            ]}
          />
          <Button href={site.bookingUrl} external variant="dk">
            Reserve a bay
          </Button>
        </SplitBlock>
      </section>

      <section className="py-24 bg-cream">
        <div className="wrap">
          <SectionHead
            kicker="Serving"
            title="Golfers from across the LA basin."
            intro={`Walk-in from Old Town, drive over from ${site.areaServed.slice(1).join(", ")}. The studio is a short trip from most of the San Gabriel Valley and easy to reach from downtown Los Angeles.`}
          />
        </div>
      </section>

      <section className="py-24">
        <div className="wrap">
          <SectionHead align="center" kicker="Good to Know" title="Simulator FAQ." />
          <FAQAccordion items={items} />
        </div>
      </section>
    </>
  );
}
