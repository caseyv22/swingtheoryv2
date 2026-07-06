import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import FAQAccordion from "@/components/FAQAccordion";
import { site } from "@/data/site-config";
import { faqs } from "@/data/faqs";
import { faqPageSchema } from "@/schema";

export default function FAQ() {
  return (
    <>
      <SEO
        title="Swing Theory FAQ, Indoor Golf in Pasadena"
        description="Frequently asked questions about Swing Theory Indoor Golf in Old Town Pasadena: pricing, rentals, memberships, lessons, and events."
        path="/faq"
        image={`${site.url}/images/home/home-sim-bays.webp`}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Hero
        kicker="FAQ"
        title={<>Frequently asked.</>}
        sub="Everything most people ask before their first visit, from pricing and clubs to memberships and events."
        ctas={<span />}
        poster="/images/home/home-sim-bays.webp"
      />

      <section className="py-24">
        <div className="wrap">
          <FAQAccordion items={faqs} />
        </div>
      </section>
    </>
  );
}
