import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import FAQAccordion from "@/components/FAQAccordion";
import EventInquiryForm from "@/components/forms/EventInquiryForm";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { faqsFor } from "@/data/faqs";
import { serviceSchema, faqPageSchema } from "@/schema";
import { useRef } from "react";

export default function Events() {
  const items = faqsFor("events");
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <SEO
        title="Private Event Venue in Pasadena — Corporate, Birthday, Group | Swing Theory"
        description="Host your private event at Swing Theory Indoor Golf in Old Town Pasadena. Corporate outings, birthdays, bachelor parties, and buyouts for groups from 4 to 40+."
        path="/events"
      />
      <JsonLd
        data={[
          serviceSchema({
            name: "Private events",
            description:
              "Private and corporate events at Swing Theory Indoor Golf in Old Town Pasadena. Semi-private and full buyouts.",
            url: `${site.url}/events`,
            serviceType: "Event venue",
          }),
          faqPageSchema(items),
        ]}
      />

      <Hero
        kicker="Private Events"
        title={
          <>
            Private events in <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Birthdays, corporate team-building, bachelor parties, and full buyouts. We handle the bays, the tech, and the setup — you bring the group (and your own food and drinks)."
        ctas={
          <>
            <Button onClick={scrollToForm} variant="gold">
              Plan an event
            </Button>
            <Button href={site.bookingUrl} external variant="ghost">
              Book a bay
            </Button>
          </>
        }
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07845-1024x683.jpg"
      />

      <section className="py-24">
        <SplitBlock
          imageSrc="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07877-1024x683.jpg"
          imageAlt="Private event bay at Swing Theory Pasadena"
        >
          <span className="kicker">What's included</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Your group, our studio.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Four wide simulator bays including a private suite for karaoke,
            speeches, or off-the-clock team play. Bring your own catering — we
            keep the space set up around whatever your night looks like.
          </p>
          <FeatList
            items={[
              "Semi-private and full-buyout options",
              "Dedicated host during your event",
              "Groups from 4 to 40+",
              "BYO food and beverage welcomed",
              "Private karaoke suite",
              "Right and left-handed rental clubs on hand",
            ]}
          />
          <Button onClick={scrollToForm} variant="dk">
            Send inquiry
          </Button>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper" ref={formRef}>
        <div className="wrap max-w-3xl">
          <SectionHead
            kicker="Events Inquiry"
            title="Tell us about your event."
            intro="Group size, date range, and event type help us send back real options within one business day."
          />
          <EventInquiryForm />
        </div>
      </section>

      <section className="py-24">
        <div className="wrap">
          <SectionHead align="center" kicker="Good to Know" title="Events FAQ." />
          <FAQAccordion items={items} />
        </div>
      </section>
    </>
  );
}
