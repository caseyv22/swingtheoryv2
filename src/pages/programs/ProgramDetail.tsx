import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import Button from "@/components/Button";
import LeagueSignupForm from "@/components/forms/LeagueSignupForm";
import InterestForm from "@/components/forms/InterestForm";
import MiniMulligansWaitlistForm from "@/components/forms/MiniMulligansWaitlistForm";
import { site } from "@/data/site-config";
import type { ProgramDisplay } from "@/hooks/usePrograms";
import { serviceSchema } from "@/schema";
import { useRef } from "react";

// Fixed hero photos, one per known program slug. These are intentionally
// NOT tied to program.image (which is the admin-uploaded photo shown next
// to the "About the program" text block and on the /programs card), Casey
// flagged that a single admin upload was silently changing both the hero
// background and the text-block photo. Keeping the hero static here means
// uploading a new "About the program" image never touches the hero.
const heroBySlug: Record<string, string> = {
  "league-night": "/images/programs/stgl-league-night.webp",
  "mini-mulligans": "/images/programs/programs-mini-mulligans.webp",
};
const defaultProgramHero = "/images/home/home-sim-bays.webp";

function isOngoing(v: string): boolean {
  return v.trim().toLowerCase() === "ongoing";
}

function formatStartsOn(v: string): string {
  if (isOngoing(v)) return "Ongoing";
  // v is YYYY-MM-DD from the admin date input; parse as local, not UTC,
  // so it doesn't shift a day depending on timezone.
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return v;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Schedule/pricing pill, kept visually separate from the body copy so it
// reads as scannable metadata rather than part of the description text.
function Pill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-1.5 text-[0.9rem] text-ink">
      {value}
    </span>
  );
}

type Props = {
  program: ProgramDisplay;
};

// Shared program template. Every program page hits identical SEO patterns:
// H1 with primary keyword, first-paragraph direct answer, Service schema.
// Mini Mulligans has a purpose-built early-access waitlist form
// (kid name + age, hard-capped at 18) instead of the shared InterestForm.
// Kept as a slug list so future junior programs can share the same
// waitlist UX with one edit here.
const WAITLIST_SLUGS = new Set<string>(["mini-mulligans"]);

export default function ProgramDetail({ program }: Props) {
  const { useLeagueForm, useCheckout } = program;
  const useWaitlist = WAITLIST_SLUGS.has(program.slug) && !useCheckout;
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const path = `/programs/${program.slug}`;
  const checkoutHref = `/programs/checkout?plan=${program.slug}`;

  return (
    <>
      <SEO
        title={`${program.name}, Indoor Golf in Pasadena | Swing Theory`}
        description={program.shortDescription}
        path={path}
        image={`${site.url}${heroBySlug[program.slug] ?? defaultProgramHero}`}
      />
      <JsonLd
        data={serviceSchema({
          name: program.name,
          description: program.shortDescription,
          url: `${site.url}${path}`,
          serviceType: "Golf program",
        })}
      />

      <Hero
        kicker={program.kicker}
        title={<>{program.h1}</>}
        sub={program.shortDescription}
        ctas={
          <>
            {useCheckout ? (
              <Button to={checkoutHref} variant="gold">
                {program.ctaLabel}
              </Button>
            ) : (
              <Button onClick={scrollToForm} variant="gold">
                {program.ctaLabel}
              </Button>
            )}
            <Button to="/programs" variant="ghost">
              All programs
            </Button>
          </>
        }
        poster={heroBySlug[program.slug] ?? defaultProgramHero}
      />

      <section className="py-24">
        <SplitBlock
          imageSrc={program.image}
          imageAlt={program.name}
        >
          <span className="kicker">About the program</span>
          <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] text-green-700 mt-3 mb-4">
            {program.name}
          </h2>
          {(program.dateRange || program.timeRange || program.price || program.startsOn) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {program.dateRange && <Pill value={program.dateRange} />}
              {program.timeRange && <Pill value={program.timeRange} />}
              {program.price && <Pill value={program.price} />}
              {program.startsOn && <Pill value={formatStartsOn(program.startsOn)} />}
            </div>
          )}
          {/* longdesc-content class picks up the same paragraph, heading,
              list, and link styles the admin drawer's RichTextEditor uses,
              so the WYSIWYG in the drawer matches what customers see. Only
              admins can edit this field so trusting the HTML is fine. */}
          <div
            className="longdesc-content text-muted text-[1.08rem]"
            dangerouslySetInnerHTML={{ __html: program.longDescription }}
          />
          <FeatList items={program.keyDetails} />
          {program.season && (
            <p className="text-muted text-[0.98rem] italic">{program.season}</p>
          )}
          <div className="mt-6">
            {useCheckout ? (
              <Button to={checkoutHref} variant="dk">
                {program.ctaLabel}
              </Button>
            ) : (
              <Button onClick={scrollToForm} variant="dk">
                {program.ctaLabel}
              </Button>
            )}
          </div>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper" ref={formRef}>
        <div className={useWaitlist ? "wrap" : "wrap max-w-3xl"}>
          {useWaitlist ? (
            <>
              <SectionHead
                kicker="Registration open"
                title="Sign up for Mini Mulligans."
                intro="Reserve your child's spot for the Mini Mulligans launch on Tuesday, September 22. No payment required today, a Swing Theory team member will reach out to confirm your sign-up and get you set for launch day."
              />
              <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] items-start mt-10">
                <div className="order-2 md:order-1">
                  <MiniMulligansWaitlistForm />
                </div>

                {/* Order Summary, mirrors the checkout pages. No pricing-today
                    line here on purpose: signing up doesn't charge or hold
                    anything, it's a plain reservation. A Swing Theory team
                    member reaches out afterward to confirm the spot, and the
                    $400/month note keeps the eventual cost transparent
                    without asking for payment info up front. */}
                <aside className="order-1 md:order-2 rounded-2xl border border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03] p-8 md:sticky md:top-24">
                  <h2 className="font-disp text-xl text-green-700 tracking-wide uppercase mb-6">
                    Order Summary
                  </h2>
                  <div className="border-t border-line pt-5">
                    <span className="kicker">Registering for</span>
                    <div className="font-disp text-2xl text-green-700 mt-2">
                      Mini Mulligans
                    </div>
                    <p className="text-muted text-sm mt-2 leading-relaxed">
                      Junior golf, ages 6–13. Launches Tuesday, September 22.
                      Sessions Tuesdays &amp; Thursdays, 4:30–6:00 PM.
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-line flex items-baseline justify-between gap-3">
                    <span className="font-disp font-semibold text-sm text-ink uppercase tracking-wide">
                      Due today
                    </span>
                    <span className="font-disp text-[1.8rem] font-extrabold text-gold-dk leading-none">
                      $0
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-3 text-right">
                    No payment required to sign up.
                  </p>
                  <div className="mt-6 pt-4 border-t border-line">
                    <p className="text-sm text-ink leading-relaxed">
                      A <span className="font-semibold">Swing Theory team member</span> will
                      reach out to confirm your sign-up. Your first session on
                      Sept 22 is free, and <span className="font-semibold">$400/month</span> begins
                      only if you continue after that.
                    </p>
                  </div>
                  <p className="text-xs text-muted mt-6 pt-4 border-t border-line">
                    Questions? Email {site.email} or call {site.phone.display}.
                  </p>
                </aside>
              </div>
            </>
          ) : useLeagueForm ? (
            <>
              <SectionHead
                kicker="Sign up"
                title={program.ctaLabel + "."}
                intro={`Fill this out and we'll follow up with ${program.name.toLowerCase()} details, timing, and next steps.`}
              />
              <LeagueSignupForm />
            </>
          ) : (
            <>
              <SectionHead kicker="Programs Interest" title="Questions?" intro="Send us a message!" />
              <InterestForm defaultTopic={program.name} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
