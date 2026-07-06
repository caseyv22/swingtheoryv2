// JSON-LD builders. Every page composes the pieces it needs.
// Referenced from <JsonLd> component.

import { site, sameAs } from "@/data/site-config";
import type { FAQ } from "@/data/faqs";

const businessId = `${site.url}/#business`;

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "GolfCourse", "SportsActivityLocation"],
    "@id": businessId,
    name: site.name,
    url: site.url,
    telephone: site.phone.tel,
    email: site.email,
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
    provider: { "@id": businessId },
    areaServed: site.areaServed.map((c) => ({ "@type": "City", name: c })),
  };
}

export function faqPageSchema(items: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
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
