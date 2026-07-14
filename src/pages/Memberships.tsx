import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import PlanCard from "@/components/PlanCard";
import InterestForm from "@/components/forms/InterestForm";
import Button from "@/components/Button";
import { site } from "@/data/site-config";
import { membershipPlans } from "@/data/memberships";
import { serviceSchema } from "@/schema";
import { useRef } from "react";

export default function Memberships() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <SEO
        title="Indoor Golf Memberships in Pasadena | Swing Theory"
        description="Join the Swing Theory indoor golf membership program in Old Town Pasadena. Monthly bay hours, extended hours booking, member pricing, and league play options."
        path="/memberships"
        image={`${site.url}/images/home/home-sim-bays.webp`}
      />
      <JsonLd
        data={serviceSchema({
          name: "Indoor golf membership",
          description:
            "Membership program with monthly simulator hours, extended hours booking, and member pricing at Swing Theory Indoor Golf in Old Town Pasadena.",
          url: `${site.url}/memberships`,
          serviceType: "Membership",
        })}
      />

      <Hero
        kicker="Memberships"
        title={
          <>
            Play more. <em className="not-italic text-gold">Dial in year-round.</em>
          </>
        }
        sub="Extended hours booking, monthly bay hours, and member perks, built for regulars who want their swing sharp all year, indoors, no matter the weather."
        ctas={
          <>
            <Button onClick={scrollToForm} variant="gold">
              Request membership info
            </Button>
            <Button href={site.bookingUrl} external variant="ghost">
              Just book a bay
            </Button>
          </>
        }
        poster="/images/home/home-sim-bays.webp"
      />

      <section className="py-24 bg-green-900">
        <div className="wrap">
          <SectionHead dark kicker="Plans" title="Choose your fit." />
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {membershipPlans.map((p) => (
              <PlanCard key={p.slug} plan={p} onInterest={scrollToForm} onLeague={scrollToForm} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" ref={formRef} id="interest">
        <div className="wrap max-w-3xl">
          <SectionHead kicker="Membership Interest" title="Questions?" intro="Send us a message!" />
          <InterestForm defaultTopic="Green Jacket Group" extraOptions={["Green Jacket Group"]} />
        </div>
      </section>
    </>
  );
}
