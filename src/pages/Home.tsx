import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import SectionHead from "@/components/SectionHead";
import XCard from "@/components/XCard";
import StatBand from "@/components/StatBand";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import PlanCard from "@/components/PlanCard";
import ReviewCard from "@/components/ReviewCard";
import FAQAccordion from "@/components/FAQAccordion";
import MapCard from "@/components/MapCard";
import Button from "@/components/Button";
import InterestForm from "@/components/forms/InterestForm";
import { membershipPlans } from "@/data/memberships";
import { reviews, ratingPlatforms } from "@/data/reviews";
import { faqsFor } from "@/data/faqs";
import { site } from "@/data/site-config";
import { faqPageSchema } from "@/schema";
import { useRef } from "react";

export default function Home() {
  const homeFaqs = faqsFor("home");
  const memberRef = useRef<HTMLDivElement | null>(null);
  const scrollToMembership = () =>
    memberRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <SEO
        title="Indoor Golf and Golf Simulators in Old Town Pasadena | Swing Theory"
        description="Swing Theory is an indoor golf studio in Old Town Pasadena. Four wide simulator bays, tour-grade launch monitors, 100+ world courses, lessons, leagues, and private events."
        path="/"
        image={`${site.url}/images/home/home-sim-bays-og.jpg`}
      />
      {/* FAQ subset schema on the homepage (matches visible answers verbatim) */}
      <JsonLd data={faqPageSchema(homeFaqs)} />

      <Hero
        kicker="Old Town Pasadena · Indoor Golf Studio"
        title={
          <>
            Indoor golf simulators in <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Four wide simulator bays, tour-grade launch monitors, and 100+ world courses. Practice year-round, take a lesson, or host an event, rain or shine, seven days a week."
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
        trust={
          <>
            <div className="flex items-center gap-2 font-disp text-[13.5px] tracking-[0.06em] uppercase text-[#dcdac9]">
              <span className="text-gold tracking-[2px]">★★★★★</span> 5.0 on Google
            </div>
            <div className="font-disp text-[13.5px] tracking-[0.06em] uppercase text-[#dcdac9]">
              Uneekor &amp; GSPro tech
            </div>
            <div className="font-disp text-[13.5px] tracking-[0.06em] uppercase text-[#dcdac9]">
              Private suite for events
            </div>
          </>
        }
        videoSrc="/images/home/home-hero-compressed.mp4"
        poster="/images/home/home-sim-bays.webp"
      />

      <Marquee
        items={[
          "Uneekor Launch Monitors",
          "GSPro Golf Simulation",
          "24 Data Points",
          "100+ World Courses",
          "Private Suite",
          "Leagues",
          "Lessons",
          "Junior Program",
        ]}
      />

      {/* Experience */}
      <section className="py-24" id="experience">
        <div className="wrap">
          <SectionHead
            kicker="The Experience"
            title="A real place to work on your game in Pasadena."
            intro="Wide, comfortable bays. High-end simulators. A studio built for serious reps, group play, and everything in between."
          />
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
            <XCard
              tag="Play"
              title="Simulator bays"
              body="Book by the hour. Play 100+ courses or hit the range."
              image="/images/home/home-sim-bays.webp"
              alt="Swing Theory simulator bays in Pasadena"
              to="/simulators"
            />
            <XCard
              tag="Improve"
              title="Lessons"
              body="Data-backed coaching with club-face replay on every swing."
              image="/images/home/home-lessons.webp"
              alt="Indoor golf lesson in Old Town Pasadena"
              to="/lessons"
            />
            <XCard
              tag="Host"
              title="Private events"
              body="Buyouts for birthdays, corporate nights, and team building."
              image="/images/events/eventhero.jpg"
              alt="Private event bay at Swing Theory"
              to="/events"
            />
            <XCard
              tag="Compete"
              title="League &amp; community"
              body="Weekly league play, junior program, and seasonal series."
              image="/images/home/home-leaguecommunity.webp"
              alt="Swing Theory Golf League night"
              to="/league"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatBand
        stats={[
          { n: "4", l: "Wide sim bays" },
          { n: "100+", l: "World courses" },
          { n: "5.0★", l: "Google rating" },
          { n: "7", l: "Days a week" },
        ]}
      />

      {/* Technology */}
      <section className="py-24" id="tech">
        <SplitBlock
          imageSrc="/images/home/home-uneekor.webp"
          imageAlt="Uneekor launch monitor tracking a swing at Swing Theory"
        >
          <span className="kicker">The Technology</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Practice like the pros.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Every bay runs a tour-grade Uneekor launch monitor and GSPro
            simulation, the same class of tech used on Tour. So whether
            you're grinding or playing Pebble with friends, the feedback is real.
          </p>
          <FeatList
            items={[
              "Ball speed, spin, launch, carry, and club-face data on every shot",
              "Slow-motion swing and impact replay",
              "Play iconic courses or dial in on the virtual range",
              "Skills games, closest-to-pin, and league formats",
            ]}
          />
          <Button href={site.bookingUrl} external variant="dk">
            Reserve a session
          </Button>
        </SplitBlock>
      </section>

      {/* Memberships */}
      <section className="py-24 bg-green-900" id="memberships" ref={memberRef}>
        <div className="wrap">
          <SectionHead
            dark
            kicker="Memberships &amp; Hourly"
            title="Play more. Dial in year-round."
            intro="Extended hours booking, monthly bay hours, and member perks, built for regulars who want their swing sharp all year."
          />
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {membershipPlans.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} onInterest={scrollToMembership} onLeague={scrollToMembership} />
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
              <h3 className="font-disp text-2xl text-white mb-2">Questions?</h3>
              <p className="text-[#b9bdb0] mb-6 text-[0.98rem]">Send us a message!</p>
              <div className="bg-white rounded-xl p-6">
                <InterestForm defaultTopic="Green Jacket Group" extraOptions={["Green Jacket Group"]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Private events */}
      <section className="py-24" id="events">
        <SplitBlock
          imageSrc="/images/events/eventhero.jpg"
          imageAlt="Private event at Swing Theory Pasadena"
          imageSide="right"
        >
          <span className="kicker">Private Events</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Your next unforgettable night out.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Birthdays, corporate team-building, bachelor parties, or a Friday
            with friends. Bring your own food and drinks. We handle the golf,
            the bays, and the tech.
          </p>
          <FeatList
            items={[
              "Semi-private and fully private buyouts",
              "Dedicated host during your event",
              "Groups from 4 to 40+",
              "BYO food and beverage welcomed",
            ]}
          />
          <Button to="/events" variant="dk">
            Plan an event
          </Button>
        </SplitBlock>
      </section>

      {/* Reviews */}
      <section className="py-24 bg-paper">
        <div className="wrap">
          <SectionHead
            align="center"
            kicker="Loved in Pasadena"
            title="5.0 stars, and counting."
          />
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-12 reveal">
            {ratingPlatforms.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 font-disp text-sm text-muted hover:text-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded"
                aria-label={`See our reviews on ${p.name}`}
              >
                <span className="text-gold tracking-[2px]">★★★★★</span>
                <span className="font-semibold text-green-700">5.0</span>
                <span>{p.name}</span>
              </a>
            ))}
          </div>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {reviews.map((r, i) => (
              <ReviewCard key={i} review={r} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24" id="faq">
        <div className="wrap">
          <SectionHead
            align="center"
            kicker="Good to Know"
            title="Frequently asked."
          />
          <FAQAccordion items={homeFaqs} />
        </div>
      </section>

      {/* Heart of Old Town / Visit */}
      <section className="py-24 bg-green-700 text-white" id="visit">
        <div className="wrap grid gap-14 md:grid-cols-2 items-center">
          <div className="reveal">
            <span className="kicker !text-gold">Visit Us</span>
            <h2 className="text-white text-[clamp(1.9rem,3.6vw,2.9rem)] mt-3 mb-6">
              In the heart of Old Town Pasadena.
            </h2>

            <div className="flex gap-3 py-3 border-b border-white/10">
              <span className="text-gold text-xl leading-none">◉</span>
              <div>
                <b className="font-disp">{site.name}</b>
                <br />
                {site.address.street}
                <br />
                {site.address.city}, {site.address.region} {site.address.postalCode}
              </div>
            </div>
            <div className="flex gap-3 py-3 border-b border-white/10">
              <span className="text-gold text-xl leading-none">✆</span>
              <div>
                <b className="font-disp">
                  <a href={`tel:${site.phone.tel}`}>{site.phone.display}</a>
                </b>
                <br />
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </div>
            </div>
            <div className="flex gap-3 py-3 border-b border-white/10">
              <span className="text-gold text-xl leading-none">◷</span>
              <div>
                <b className="font-disp">Hours</b>
                <br />
                {site.hours.display}
              </div>
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
              <Button href={site.bookingUrl} external variant="gold">
                Book a bay
              </Button>
              <Button to="/visit" variant="ghost">
                Directions &amp; parking
              </Button>
            </div>
          </div>
          <MapCard />
        </div>
      </section>
    </>
  );
}
