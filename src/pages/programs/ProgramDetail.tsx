import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import Button from "@/components/Button";
import LeagueSignupForm from "@/components/forms/LeagueSignupForm";
import InterestForm from "@/components/forms/InterestForm";
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
  "mini-mulligans": "/images/programs/programs-mini-mulligans.jpg",
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
export default function ProgramDetail({ program }: Props) {
  const { useLeagueForm, useCheckout } = program;
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
          <p className="text-muted text-[1.08rem]">{program.longDescription}</p>
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
        <div className="wrap max-w-3xl">
          {useLeagueForm ? (
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
