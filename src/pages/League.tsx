import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import LeagueSignupForm from "@/components/forms/LeagueSignupForm";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { serviceSchema } from "@/schema";
import { useApi } from "@/hooks/useApi";
import type { LeagueEventRow } from "@/data/types";
import { useRef } from "react";

// /league is the top-level page for STGL. Replaces the previous
// /programs/league-night route (which now 301s here in public/_redirects).
// Admin controls the "next upcoming event" callout via /admin/league.
export default function League() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const { data: next, loading } = useApi<LeagueEventRow | null>("/api/public/league-next");

  return (
    <>
      <SEO
        title="Swing Theory Golf League, Indoor Golf League in Pasadena"
        description="Weekly indoor golf league at Swing Theory in Old Town Pasadena. Match play with handicaps, live standings, season prizes. Open to individuals and teams."
        path="/league"
      />
      <JsonLd
        data={serviceSchema({
          name: "Swing Theory Golf League",
          description:
            "Weekly indoor golf league in Old Town Pasadena. Match play with handicaps, live standings, season prizes.",
          url: `${site.url}/league`,
          serviceType: "Golf league",
        })}
      />

      <Hero
        kicker="Swing Theory Golf League"
        title={
          <>
            Indoor golf league in <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Weekly matches on tour-grade simulators, live standings, and a season championship. Sign up as an individual and we'll place you on a team, or bring your own."
        ctas={
          <>
            <Button onClick={scrollToForm} variant="gold">
              Sign up
            </Button>
            <Button href={site.bookingUrl} external variant="ghost">
              Book a bay
            </Button>
          </>
        }
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07885-scaled.jpg"
      />

      {/* Next upcoming event — admin-controlled */}
      <section className="py-16 bg-cream">
        <div className="wrap">
          <div className="reveal">
            <span className="kicker">Next up</span>
            {loading ? (
              <div className="mt-4 text-muted">Loading…</div>
            ) : next ? (
              <NextEventCard event={next} onSignup={scrollToForm} />
            ) : (
              <div className="mt-4 rounded-2xl border border-line bg-paper p-8">
                <h2 className="text-2xl text-green-700 font-disp">
                  Next season kicks off soon.
                </h2>
                <p className="text-muted mt-2">
                  Sign up below and we'll email details before the next league
                  night starts.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-24">
        <SplitBlock
          imageSrc="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07885-scaled.jpg"
          imageAlt="Swing Theory Golf League night in Pasadena"
        >
          <span className="kicker">How it works</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            Match play, real handicaps, real standings.
          </h2>
          <p className="text-muted text-[1.08rem]">
            Teams play head-to-head matches on the simulators across the season.
            Handicaps keep matches close for every skill level. Live standings,
            playoff bracket, and a season champion with a green jacket at the end.
          </p>
          <FeatList
            items={[
              "Weekly evening matches on tour-grade simulators",
              "Format: match play with handicaps",
              "Live standings and playoff bracket",
              "Season prizes and a green jacket",
              "Open to individuals, we place free agents on teams",
            ]}
          />
          <Button onClick={scrollToForm} variant="dk">
            Sign up for the league
          </Button>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper" ref={formRef} id="signup">
        <div className="wrap max-w-3xl">
          <SectionHead
            kicker="Sign up"
            title="Join the league."
            intro="Fill this out and we'll follow up with the current season's start date, weekly cadence, and where to be."
          />
          <LeagueSignupForm />
        </div>
      </section>
    </>
  );
}

function NextEventCard({
  event,
  onSignup,
}: {
  event: LeagueEventRow;
  onSignup: () => void;
}) {
  const start = new Date(event.starts_at);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border border-line bg-paper grid md:grid-cols-[1.1fr_1fr]">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover aspect-[4/3] md:aspect-auto"
          loading="lazy"
        />
      )}
      <div className="p-8">
        <div className="font-disp text-sm uppercase tracking-[0.14em] text-gold-dk">
          {dateStr} · {timeStr}
        </div>
        <h2 className="text-3xl text-green-700 font-disp mt-2">{event.title}</h2>
        {event.subtitle && <p className="text-muted mt-1">{event.subtitle}</p>}
        {event.description && (
          <p className="text-ink mt-4 whitespace-pre-line">{event.description}</p>
        )}
        {event.location_line && (
          <p className="text-muted mt-4 text-sm">{event.location_line}</p>
        )}
        <div className="mt-6">
          {event.cta_url.startsWith("/league") ? (
            <Button onClick={onSignup} variant="dk">
              {event.cta_label || "Sign up"}
            </Button>
          ) : (
            <Button href={event.cta_url} variant="dk">
              {event.cta_label || "Sign up"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
