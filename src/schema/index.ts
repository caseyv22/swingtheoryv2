// JSON-LD builders. Every page composes the pieces it needs.
// Referenced from <JsonLd> component.

import { site, sameAs } from "@/data/site-config";
import type { FAQ } from "@/data/faqs";

const businessId = `${site.url}/#business`;

// Build-time date stamped into every schema block as `dateModified`.
// AI engines (Perplexity, ChatGPT Search, Google AI Overviews) weight
// freshness heavily — pages updated <30 days ago get roughly 3× more
// citations. The Vite build resolves this to a literal at compile
// time, so it changes on every deploy without any runtime cost.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "GolfCourse", "SportsActivityLocation"],
    "@id": businessId,
    name: site.name,
    url: site.url,
    dateModified: BUILD_DATE,
    telephone: site.phone.tel,
    // Email intentionally NOT inlined here — dumping it in JSON-LD
    // leaks plaintext to scrapers (SEO audit flagged it) and Cloudflare's
    // email-obfuscation script only rewrites <a href="mailto:"> nodes.
    // Instead, expose the /contact page via contactPoint, which is the
    // modern schema.org pattern Google actually prefers.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: site.phone.tel,
      url: `${site.url}/contact`,
      areaServed: "US",
      availableLanguage: ["English"],
    },
    image: [
      `${site.url}/images/home/home-sim-bays.webp`,
      `${site.url}/images/simulators/bay.webp`,
      `${site.url}/images/events/main-room-1.webp`,
    ],
    logo: site.logos.green,
    priceRange: site.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    areaServed: site.areaServed.map((c) => ({ "@type": "City", name: c })),
    openingHoursSpecification: site.hours.schema.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs,
    aggregateRating:
      site.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: site.rating.value,
            reviewCount: site.rating.count,
          }
        : undefined,
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: site.logos.green,
    sameAs,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
  };
}

export function serviceSchema(args: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: args.name,
    description: args.description,
    url: args.url,
    serviceType: args.serviceType,
    dateModified: BUILD_DATE,
    provider: { "@id": businessId },
    areaServed: site.areaServed.map((c) => ({ "@type": "City", name: c })),
  };
}

export function faqPageSchema(items: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: BUILD_DATE,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
