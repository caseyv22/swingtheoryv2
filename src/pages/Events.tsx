import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import FAQAccordion from "@/components/FAQAccordion";
import Gallery from "@/components/Gallery";
import EventInquiryForm from "@/components/forms/EventInquiryForm";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { faqsFor } from "@/data/faqs";
import { serviceSchema, faqPageSchema } from "@/schema";
import { useRef } from "react";

const gallerySlides = [
  { src: "/images/events/main-room-1.webp", alt: "Main room bays set up for a private event at Swing Theory" },
  { src: "/images/events/main-room-3.webp", alt: "Swing Theory event space with simulator bays" },
  { src: "/images/events/kapula-bay.webp", alt: "Simulator bay ready for a private event" },
  { src: "/images/events/kapula-bay-2.webp", alt: "Simulator bay with seating for a group" },
  { src: "/images/events/lounge-area.webp", alt: "Lounge seating area at Swing Theory" },
  { src: "/images/events/putting-area.webp", alt: "Putting area at Swing Theory" },
];

const pricing = [
  {
    label: "Weekday rates",
    note: "Monday–Thursday. Corporate outings and team building.",
    from: "$900",
    tiers: [
      { d: "3 hours", p: "$900" },
      { d: "4 hours", p: "$1,400" },
      { d: "All day", p: "$1,800" },
    ],
  },
  {
    label: "Weekend rates",
    note: "Friday–Sunday. Birthdays and celebrations.",
    from: "$1,200",
    tiers: [
      { d: "3 hours", p: "$1,200" },
      { d: "4 hours", p: "$1,600" },
      { d: "All day", p: "$2,400" },
    ],
  },
];

export default function Events() {
  const items = faqsFor("events");
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <SEO
        title="Private Event Venue in Pasadena: Corporate, Birthday, Group | Swing Theory"
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
        sub="Birthdays, corporate team-building, bachelor parties, and full buyouts. We handle the bays, the tech, and the setup, you bring the group (and your own food and drinks)."
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
        poster="/images/events/main-room-1.webp"
      />

      <section className="py-24">
        <SplitBlock
          imageSrc="/images/events/main-room-3.webp"
          imageAlt="Private event bay at Swing Theory Pasadena"
        >
          <span className="kicker">What's included</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Your group, our studio.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Four wide simulator bays including a private suite for karaoke,
            speeches, or off-the-clock team play. Bring your own catering. We
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

      <section className="py-24 bg-cream">
        <div className="wrap">
          <SectionHead
            align="center"
            kicker="See The Space"
            title="Bays, lounge, and putting area."
          />
          <div className="max-w-4xl mx-auto">
            <Gallery slides={gallerySlides} />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap">
          <SectionHead
            align="center"
            kicker="Video Tour"
            title="Walk the space before you book."
          />
          <div className="reveal max-w-sm mx-auto">
            <video
              className="w-full rounded-2xl border border-line aspect-[9/16] object-cover bg-green-900"
              controls
              playsInline
              preload="metadata"
              poster="/images/events/main-room-1.webp"
            >
              <source src="/images/events/space-tour.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="py-24 bg-green-900">
        <div className="wrap">
          <SectionHead
            dark
            align="center"
            kicker="Pricing"
            title="Event rates."
            intro="Rate depends on time of week and length of buyout. Every rate includes a dedicated host and use of the private suite."
          />
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {pricing.map((tier) => (
              <div
                key={tier.label}
                className="reveal rounded-2xl overflow-hidden bg-paper border border-line"
              >
                <div className="bg-green-700 text-white px-6 py-5 text-center">
                  <div className="font-disp text-lg">{tier.label}</div>
                  <div className="text-[#c9d2cb] text-sm mt-1">{tier.note}</div>
                </div>
                <div className="px-6 pt-6 text-center">
                  <span className="font-disp text-4xl text-green-700">
                    {tier.from}
                  </span>
                  <span className="text-muted text-sm"> +</span>
                </div>
                <div className="px-6 py-4">
                  {tier.tiers.map((t) => (
                    <div
                      key={t.d}
                      className="flex justify-between py-2 border-b border-line last:border-0 text-[0.95rem]"
                    >
                      <span className="text-muted">{t.d}</span>
                      <span className="font-disp text-ink">{t.p}</span>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6 pt-2">
                  <Button onClick={scrollToForm} variant="dk" className="w-full justify-center">
                    Send inquiry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
