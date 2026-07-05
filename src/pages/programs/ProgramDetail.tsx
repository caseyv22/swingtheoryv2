import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import SplitBlock, { FeatList } from "@/components/SplitBlock";
import Button from "@/components/Button";
import LeagueSignupForm from "@/components/forms/LeagueSignupForm";
import ProgramInterestForm from "@/components/forms/ProgramInterestForm";
import { site } from "@/data/site-config";
import type { Program } from "@/data/programs";
import { serviceSchema } from "@/schema";
import { useRef } from "react";

// Fixed hero photos, one per known program slug. These are intentionally
// NOT tied to program.image (which is the admin-uploaded photo shown next
// to the "About the program" text block and on the /programs card) — Casey
// flagged that a single admin upload was silently changing both the hero
// background and the text-block photo. Keeping the hero static here means
// uploading a new "About the program" image never touches the hero.
const heroBySlug: Record<string, string> = {
  "league-night": "/images/programs/stgl-league-night.webp",
};
const defaultProgramHero = "/images/home/home-sim-bays.webp";

function formatStartsOn(iso: string): string {
  // iso is YYYY-MM-DD from the admin date input; parse as local, not UTC,
  // so it doesn't shift a day depending on timezone.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  program: Program;
  useLeagueForm?: boolean; // League Night uses the dedicated form
};

// Shared program template. Every program page hits identical SEO patterns:
// H1 with primary keyword, first-paragraph direct answer, Service schema.
export default function ProgramDetail({ program, useLeagueForm = false }: Props) {
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const path = `/programs/${program.slug}`;

  return (
    <>
      <SEO
        title={`${program.name}, Indoor Golf in Pasadena | Swing Theory`}
        description={program.shortDescription}
        path={path}
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
            <Button onClick={scrollToForm} variant="gold">
              {program.ctaLabel}
            </Button>
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
          <p className="text-muted text-[1.08rem]">{program.longDescription}</p>
          <FeatList items={program.keyDetails} />
          {program.season && (
            <p className="text-muted text-[0.98rem] italic">{program.season}</p>
          )}
          {(program.dateRange || program.timeRange || program.price || program.startsOn) && (
            <div className="mt-4 rounded-xl border border-line bg-cream/60 p-5 grid gap-2 text-[0.98rem]">
              {program.dateRange && (
                <div>
                  <span className="font-disp text-green-700">When: </span>
                  {program.dateRange}
                </div>
              )}
              {program.timeRange && (
                <div>
                  <span className="font-disp text-green-700">Time: </span>
                  {program.timeRange}
                </div>
              )}
              {program.price && (
                <div>
                  <span className="font-disp text-green-700">Price: </span>
                  {program.price}
                </div>
              )}
              {program.startsOn && (
                <div>
                  <span className="font-disp text-green-700">Starts: </span>
                  {formatStartsOn(program.startsOn)}
                </div>
              )}
            </div>
          )}
          <div className="mt-6">
            <Button onClick={scrollToForm} variant="dk">
              {program.ctaLabel}
            </Button>
          </div>
        </SplitBlock>
      </section>

      <section className="py-24 bg-paper" ref={formRef}>
        <div className="wrap max-w-3xl">
          <SectionHead
            kicker="Sign up"
            title={program.ctaLabel + "."}
            intro={`Fill this out and we'll follow up with ${program.name.toLowerCase()} details, timing, and next steps.`}
          />
          {useLeagueForm ? (
            <LeagueSignupForm />
          ) : (
            <ProgramInterestForm program={program.name} />
          )}
        </div>
      </section>
    </>
  );
}
